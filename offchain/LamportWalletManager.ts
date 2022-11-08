import { ethers } from 'ethers'
import { hash_b, mk_key_pair, sign_hash, verify_signed_hash } from './functions';
import KeyTracker from './KeyTracker'
import { KeyPair, LamportKeyPair } from './Types'
import * as _supportedBlockchains from '../supportedBlockchains.json'
import * as _factoryabi from '../abi/factoryabi.json'
import * as _walletabi from '../abi/walletabi.json'
import * as _erc20abi from '../abi/erc20abi.json'
import * as _erc721abi from '../abi/erc721abi.json'

const supportedBlockchains = _supportedBlockchains.default
const factoryabi = _factoryabi.default
const walletabi = _walletabi.default
const erc20abi = _erc20abi.default
const erc721abi = _erc721abi.default

type TokenInfo = {
    tokenId: string
    tokenURI: string
}

function lamport_getCurrentAndNextKeyData(k: KeyTracker): ({
    current_keys: LamportKeyPair;
    next_keys: LamportKeyPair;
    nextpkh: string;
    currentpkh: string;
}) {
    const current_keys: LamportKeyPair = JSON.parse(JSON.stringify(k.currentKeyPair()))
    const next_keys: LamportKeyPair = JSON.parse(JSON.stringify(k.getNextKeyPair()))
    const nextpkh = KeyTracker.pkhFromPublicKey(next_keys.pub)
    const currentpkh = KeyTracker.pkhFromPublicKey(current_keys.pub)

    return {
        current_keys,
        next_keys,
        nextpkh,
        currentpkh
    }
}

/**
 * @name buildCallData
 * @author William Doyle 
 * @date October 25th 2022
 * @description A function to construct the data bundle to be passed to SimpleWallet::execute
 * @param abi 
 * @param functionSignature 
 * @param args 
 * @param address 
 * @param value 
 * @param gas 
 * @returns string  
 */
function buildCallData(abi: any, functionSignature: string, args: any[], address: string, value: string = '0', gas: string = '100000'): string {
    const encoder: ethers.utils.AbiCoder = new ethers.utils.AbiCoder()
    const iface = new ethers.utils.Interface(abi)
    const _funSig = iface.encodeFunctionData(functionSignature, args)
    const _data = encoder.encode(['address', 'bytes', 'uint256', 'uint256'], [address, _funSig, value, gas])
    return _data
}

function buildExecuteArguments(k: KeyTracker, functionName: string, abi: any, address: string, args: any[], value: string = '0', gas: string = '100000'): any[] {
    const { current_keys, next_keys, nextpkh, currentpkh } = lamport_getCurrentAndNextKeyData(k)
    const _data = buildCallData(abi, functionName, args, address, value, gas)
    const packed = ethers.utils.solidityPack(['bytes', 'bytes32'], [_data, nextpkh])
    const callhash = hash_b(packed)
    const sig = sign_hash(callhash, current_keys.pri)
    const is_valid_sig = verify_signed_hash(callhash, sig, current_keys.pub)
    if (!is_valid_sig)
        throw new Error(`buildExecuteArguments:: Invalid Lamport Signature`)
    return [_data, current_keys.pub, nextpkh, sig.map(s => `0x${s}`)]
}

/**
 * @name State
 * @description a type that represents the state of the LamportWalletManager
 * @author William Doyle
 * @date November 1st 2022
 */
type State = {
    chainId: string
    walletAddress: string
    ts: number // timestamp ... will be updated when serialized so that we can tell which version of the file is the most recent
    kt: KeyTracker
    network_provider_url: string
    eoa_signing_pri: string    // a private key for signing messages on behalf of the Smart Contract Wallet
    eoa_gas_pri: string        // a private key for paying for gas
    currency_contracts: string[]
    backup_keys: KeyPair[]
    nft_contracts: string[]
}


/**
 * @name LamportWalletManager
 * @description A class to manage all the logic for the lamport wallet interactions
 * @author William Doyle
 * @date November 1st 2022
 */
export default class LamportWalletManager {

    state: State = {} as State

    /**
     * @name buyNew
     * @description a function to buy a new wallet 
     * @date November 4th 2022
     * @author William Doyle
     */
    static async buyNew(gasPrivateKey: string, blockchain: string): Promise<LamportWalletManager> {
        const {
            factoryAddress,
            rpc,
            chainid,
            price
        } = supportedBlockchains.find((bc: any) => bc.name === blockchain)

        const provider = ethers.getDefaultProvider(rpc)
        const gasWallet = new ethers.Wallet(gasPrivateKey, provider)

        const factory = new ethers.Contract(factoryAddress, factoryabi, gasWallet)
        const eip1271Wallet = ethers.Wallet.createRandom()

        const kt: KeyTracker = new KeyTracker()

        const tx = await factory.createWalletEther(eip1271Wallet.address, kt.pkh, { value: ethers.utils.parseEther(price.toString()) })

        const event = (await tx.wait()).events.find((e: any) => e.event === "WalletCreated")
        const walletAddress = event.args.walletAddress

        const _lwm: LamportWalletManager = new LamportWalletManager(walletAddress, chainid, kt, rpc, eip1271Wallet.privateKey, gasWallet.privateKey)
        return _lwm
    }

    /**
     * @name toJSON
     * @description serielize the state of the LamportWalletManager
     * @date November 1st 2022
     * @author William Doyle 
     */
    toJSON(): string {
        this.state.ts = Date.now()
        return JSON.stringify(this.state, null, 2)
    }

    /**
     * @name fromJSON
     * @description deserialize the state of a LamportWalletManager and return a new instance of the class with the state set
     * @date November 1st 2022
     * @author William Doyle
     */
    static fromJSON(obj: string): LamportWalletManager {
        const t: LamportWalletManager = new LamportWalletManager('', '', {} as KeyTracker, '', '', '')
        t.state = JSON.parse(obj)
        t.state.kt = Object.assign(new KeyTracker(), t.state.kt)
        return t
    }


    /**
     * @name gasWalletAddress
     * @description a getter for the gas wallet address... computed from the gas private key. This is the vulnrable address that should be used only for gas payments
     * @date November 2022
     * @author William Doyle
     */
    get gasWalletAddress(): string {
        return ethers.utils.computeAddress(this.state.eoa_gas_pri)
    }

    /**
     * @name signingWalletAddress
     * @description a getter for the signing wallet address... computed from the signing private key. This is the vulnrable address that should be used only for signing messages (not transactions)
     * @notice it is considered best practice to not use this address for transactions, only for signing messages with ECDSA on behalf of the smart contract wallet (EIP 1271)
     * @date November 2022
     * */
    get signingWalletAddress(): string {
        return ethers.utils.computeAddress(this.state.eoa_signing_pri)
    }

    /**
     * @name constructor
     * @description the constructor for the LamportWalletManager class
     * @date November 1st 2022
     * @author William Doyle 
     */
    constructor(
        address: string,
        chainId: string,
        kt: KeyTracker,
        network_provider_url: string,
        eoa_signing_pri: string,
        eoa_gas_pri: string
    ) {
        this.state.walletAddress = address
        this.state.ts = Date.now()
        this.state.chainId = chainId
        this.state.kt = kt
        this.state.network_provider_url = network_provider_url
        this.state.eoa_signing_pri = eoa_signing_pri
        this.state.eoa_gas_pri = eoa_gas_pri
        this.state.backup_keys = []
    }

    /**
     * @name call_isValidSignature
     * @description A function to call the isValidSignature function on the lamport wallet... this function allows us to check if an ECDSA signature is valid (signed on behalf of the contract)
     * @date November 1st 2022
     * @author William Doyle
     */
    call_isValidSignature() {
        throw new Error("Not implemented")
    }

    /**
     * @name call_recover
     * @description call the recover function on the lamport wallet, which will allow us to use one of our recovery keys to recover the wallet
     * @date November 1st 2022
     * @author William Doyle
     */
    async call_recover() {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const gasWallet = new ethers.Wallet(this.state.eoa_gas_pri, provider)
        const lamportwallet: ethers.Contract = new ethers.Contract(this.state.walletAddress, walletabi, gasWallet)

        const recoveryOptions = await lamportwallet.getRecoveryPKHs()
        const recoveryKeyPair = this.state.backup_keys.find(pair => KeyTracker.pkhFromPublicKey(pair.pub) === recoveryOptions[0])

        if (recoveryKeyPair === undefined)
            throw new Error(`LamportWalletManager:: Could not find recovery key pair`)

        const k2: KeyTracker = new KeyTracker()
        const packed = ethers.utils.solidityPack(['bytes32'], [k2.pkh])
        const callhash = hash_b(packed)
        const sig = sign_hash(callhash, recoveryKeyPair.pri)
        const is_valid_sig = verify_signed_hash(callhash, sig, recoveryKeyPair.pub)

        if (!is_valid_sig)
            throw new Error(`Invalid Lamport Signature`)

        await lamportwallet.recover(k2.pkh, recoveryKeyPair.pub, sig.map(s => `0x${s}`))
        this.state.kt = k2
    }

    /**
     * @name call_setTenRecoveryPKHs
     * @description call setTenRecoveryPKHs on the lamport wallet, which will allow us to set 10 recovery keys in case we lose our wallet details
     * @date November 1st 2022
     * @author William Doyle
     */
    async call_setTenRecoveryPKHs() {
        const tenKeys = Array.from({ length: 10 }, mk_key_pair)
        const tenPKHs: string[] = tenKeys.map(pair => KeyTracker.pkhFromPublicKey(pair.pub))

        const { current_keys, nextpkh } = lamport_getCurrentAndNextKeyData(this.state.kt)
        const packed = (() => {
            const temp = ethers.utils.solidityPack(['bytes32[]'], [tenPKHs])
            return ethers.utils.solidityPack(['bytes', 'bytes32'], [temp, nextpkh])
        })()

        const callhash = hash_b(packed)
        const sig = sign_hash(callhash, current_keys.pri)
        const is_valid_sig = verify_signed_hash(callhash, sig, current_keys.pub)

        if (!is_valid_sig)
            throw new Error(`LamportWalletManager:: Invalid Lamport Signature`)

        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const gasWallet = new ethers.Wallet(this.state.eoa_gas_pri, provider)
        const lamportwallet: ethers.Contract = new ethers.Contract(this.state.walletAddress, walletabi, gasWallet)

        await lamportwallet.setTenRecoveryPKHs(tenPKHs, current_keys.pub, sig.map(s => `0x${s}`), nextpkh)

        this.state.backup_keys = tenKeys
    }

    /**
     * @name call_execute
     * @description call the execute function on the lamport wallet, this will allow us to make arbitraty calls to other contracts from the wallet
     * @date November 1st 2022
     * @author William Doyle
     */
    async call_execute(contractAddress: string, fsig: string, args: string[], abi: any) {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const gasWallet = new ethers.Wallet(this.state.eoa_gas_pri, provider)
        const lamportwallet: ethers.Contract = new ethers.Contract(this.state.walletAddress, walletabi, gasWallet)

        await lamportwallet.execute(...buildExecuteArguments(this.state.kt, fsig, abi, contractAddress, args))
    }

    /**
     * @name call_sendEther
     * @description call the sendEther function on the lamport wallet, this will allow us to send ether to another address from the wallet
     * @date November 1st 2022
     * @author William Doyle
     */
    async call_sendEther(toAddress: string, _amount: string | number | ethers.BigNumber): Promise<string> {
        const amount: string = ethers.BigNumber.from(_amount).toString()
        console.log(`LamportWalletManager::call_sendEther (toAddress: ${toAddress}, amount: ${amount})`)
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const gasWallet = new ethers.Wallet(this.state.eoa_gas_pri, provider)

        const { current_keys, nextpkh, } = lamport_getCurrentAndNextKeyData(this.state.kt)
        const packed = (() => {
            const temp = ethers.utils.solidityPack(['address', 'uint256'], [toAddress, amount])
            return ethers.utils.solidityPack(['bytes', 'bytes32'], [temp, nextpkh])
        })()
        const callhash = hash_b(packed)
        const sig = sign_hash(callhash, current_keys.pri)

        const is_valid_sig = verify_signed_hash(callhash, sig, current_keys.pub)
        if (!is_valid_sig)
            throw new Error("LamportWalletmanager::call_sendEther: Invalid Lamport Signature, Generated")

        const lamportwallet: ethers.Contract = new ethers.Contract(this.state.walletAddress, walletabi, gasWallet)
        const tx = await lamportwallet.sendEther(
            toAddress,
            amount,
            current_keys.pub,
            nextpkh,
            sig.map(s => `0x${s}`),
        )

        // console.log(`tx sent: ${tx.hash}`)
        return tx.hash
    }

    /**
     * @name ethBalanceOf
     * @description get the Eth balance of an address
     * @note this function is marked private because the interface does not need direct access to it
     * @date November 2022
     * @author William Doyle
     * */
    private async ethBalanceOf(addr: string): Promise<string> {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        return (await provider.getBalance(addr)).toString()
    }

    /**
     * @name ethBalance
     * @description get the Eth balance of the Lamport Wallet
     * @date November 2022
     * @author William Doyle 
     */
    async ethBalance(): Promise<string> {
        return this.ethBalanceOf(this.state.walletAddress)
    }

    /**
     * @name gasEthBalance
     * @description get the Eth balance of the gas EOA
     * @date November 2022
     * @author William Doyle 
     */
    async gasEthBalance(): Promise<string> {
        return this.ethBalanceOf(this.gasWalletAddress)
    }

    /**
     * @name signingEthBalance
     * @description get the Eth balance of the signing EOA (ideally this should be 0)
     * @date November 2022
     * @author William Doyle 
     */
    async signingEthBalance(): Promise<string> {
        return this.ethBalanceOf(this.signingWalletAddress)
    }

    /**
     * @name addCurrency
     * @description add an address to the list of currencies that the user may be intrested in
     * @date November 2022
     * @author William Doyle 
     */
    addCurrency(address: string) {
        if (this.state.currency_contracts === undefined)
            this.state.currency_contracts = []
        this.state.currency_contracts.push(address)
    }

    /**
     * @name addNFT
     * @description add an NFT contract address to the list of NFT contracts that the user may be intrested in
     * @date November 7th 2022
     * @author William Doyle
     */
    addNFT(address: string) {
        if (this.state.nft_contracts === undefined)
            this.state.nft_contracts = []
        this.state.nft_contracts.push(address)
    }


    /**
     * @name getCurrencyInfo
     * @description get the info for a currency given its address
     * @date November 2022
     * @author William Doyle
     * */
    async getCurrencyInfo(currencyAddress: string): Promise<[string, string, string]> {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const currency = new ethers.Contract(currencyAddress, erc20abi, provider)

        const name = await currency.name()
        const symbol = await currency.symbol()
        const balance = await currency.balanceOf(this.state.walletAddress)
        return [name, symbol, balance]
    }

    /**
     * @name getNFTInfo
     * @description get the info for an NFT given its address
     * @date November 7th 2022
     * @author William Doyle
     */
    async getNFTInfo(nftAddress: string): Promise<[string, string, string]> {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const nft = new ethers.Contract(nftAddress, erc721abi, provider)

        const name = await nft.name()
        const symbol = await nft.symbol()
        const balance = await nft.balanceOf(this.state.walletAddress)
        return [name, symbol, balance]
    }

    /**
     * @name getMyTokens
     * @description get the info for all the tokens on a erc721 contract that belong to the wallet. Returns null if contract does not implement ERC721Enumerable
     * @date November 8th 2022
     * @author William Doyle
     */
    async getMyTokens(nftAddress: string): Promise<null | TokenInfo[]> {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const nft = new ethers.Contract(nftAddress, erc721abi, provider)

        // 1. determine if implements ERC721Enumerable
        const isEnumerable = await nft.supportsInterface("0x780e9d63")
        // 2. if it does not >> early return
        if (!isEnumerable)
            return null
        // 3. if it does >> use the tokenOfOwnerByIndex function to get all the tokens
        const balance = await nft.balanceOf(this.state.walletAddress)
        const p_tokens = Array.from({ length: balance.toNumber() }, async (_, i) => {
            const tid = await nft.tokenOfOwnerByIndex(this.state.walletAddress, i)
            return {
                tokenId: tid,
                tokenURI: await nft.tokenURI(tid)
            } as TokenInfo
        })
        // 4. return the tokens
        return Promise.all(p_tokens)
    }

    /**
     * @name pkh_fromChain
     * @description get the current public key hash as it is on chain (source this data from chain: not from the KeyTracker)
     * @date November 2022
     * @author William Doyle
     */
    async pkh_fromChain(): Promise<string> {
        const provider = ethers.getDefaultProvider(this.state.network_provider_url)
        const lamportwallet: ethers.Contract = new ethers.Contract(this.state.walletAddress, walletabi, provider)
        return await lamportwallet.getPKH()
    }
}