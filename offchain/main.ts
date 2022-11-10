import { program } from 'commander'
import KeyTracker from './KeyTracker'
import LamportWalletManager, { WaiterCallback, TokenInfo } from './LamportWalletManager'
import formatOutput from './formatedOutput'
import { df } from './functions'
import * as _erc20abi from '../abi/erc20abi.json'
import * as _erc721abi from '../abi/erc721abi.json'
import { randomBytes } from 'crypto'
import { ethers } from 'ethers'

const erc20abi = _erc20abi.default
const erc721abi = _erc721abi.default

/**
 *  @name startTimer
 *  @author William Doyle 
 */
const startTimer = () => {
    const start = new Date().getTime()
    return () => {
        const end = new Date().getTime()
        return (end - start) / 1000
    }
}

/**
 * @name loadLWMFile
 * @description loads a LamportWalletManager from a json file given the file path
 * @date November 2022 
 * @author William Doyle
 */
function loadLWMFile(fname: string): LamportWalletManager {
    const fs = require('fs')
    const s = fs.readFileSync(fname, 'utf8')
    const lwm = LamportWalletManager.fromJSON(s)
    return lwm
}

/**
 * @name saveLWMFile
 * @description saves a LamportWalletManager to a json file, given the file path, also deletes the temporary file if it exists 
 * @date November 2022
 * @author William Doyle
 */
function saveLWMFile(lwm: LamportWalletManager, fname: string) {
    const s = lwm.toJSON()
    const fs = require('fs')
    fs.writeFileSync(fname, s)

    // check if fname.tmp exists
    if (fs.existsSync(fname + '.tmp')) {
        process.stdout.write(`Removing ${fname}.tmp\n`)
        fs.unlinkSync(fname + '.tmp')
    }
}

/**
 *  @name saveReceipt
 *  @description saves the TransactionReceipt to a proper file 
 *  @date November 10th 2022
 *  @author William Doyle
 */
function saveReceipt(receipt: ethers.providers.TransactionReceipt, lwm: LamportWalletManager) {
    // use data in lwm to build unique file name
    const fname = `receipts/${lwm.state.chainId}_${lwm.state.walletAddress}.json`

    // if the file exists, read it in
    const fs = require('fs')
    const data = fs.existsSync(fname) ? JSON.parse(fs.readFileSync(fname, 'utf8')) : []

    // add the receipt to the data
    data.push(receipt)

    // write the data back out
    fs.writeFileSync(fname, JSON.stringify(data, null, 2))
}

/**
 *  @name showReceipt
 *  @description displays the receipt in a nice format... some details are left out because they are not super relevent or intresting
 *  @date November 10th 2022
 *  @author William Doyle 
 */
function showReceipt(receipt: ethers.providers.TransactionReceipt) {
    const data: string[][] = []

    process.stdout.write(`\nTransaction Receipt\n`)

    data.push([`To`, receipt.to])
    data.push([`From`, receipt.from])
    data.push([`Gas Used`, receipt.gasUsed.toString()])
    data.push([`Cumulative Gas Used`, receipt.cumulativeGasUsed.toString()])
    data.push([`Effective Gas Price`, receipt.effectiveGasPrice.toString()])
    data.push([`Block Number`, receipt.blockNumber.toString()])
    data.push([`Block Hash`, receipt.blockHash])
    data.push([`Type`, receipt.type.toString()])
    data.push([`Byzantium`, receipt.byzantium.toString()])
    data.push([`Confirmations`, receipt.confirmations.toString()])
    data.push([`Transaction Hash`, receipt.transactionHash])

    formatOutput(data)
}

/**
 * @name processWaiterCallbackAndFiles
 * @description saves tempory key file, waits for transaction to be confirmed, saves the key file and deletes the tempory file, saves the receipt, and displays the receipt
 * @date November 10th 2022
 * @author William Doyle
 */
async function processWaiterCallbackAndFiles(waiter: WaiterCallback, lwm: LamportWalletManager, fname: string): Promise<void> {
    saveLWMFile(lwm, `${fname}.tmp`) // save a temporary file while transaction is in flight

    process.stdout.write(`Waiting for transaction to be confirmed.\n`)
    const receipt: ethers.providers.TransactionReceipt = await waiter()

    process.stdout.write(`Confirmed. Saving...\n`)
    saveLWMFile(lwm, fname) // also deletes the temporary file

    process.stdout.write(`Saving receipt...\n`)
    saveReceipt(receipt, lwm)

    showReceipt(receipt)
}

program
    .name('Lamport Wallet CLI by Pauli Group')
    .description('A CLI for managing Lamport wallets')
    .version('0.0.1')

program
    .command('sendeth')
    .description('send ETH from lamport wallet to specified address')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'address to send ETH to')
    .argument('<string>', 'amount of ETH to send')
    .action(async (fname: string, address: string, amount: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const waiter: WaiterCallback = await lwm.call_sendEther(address, amount)
        await processWaiterCallbackAndFiles(waiter, lwm, fname)
    })

program
    .command('setrecovery')
    .description('set ten public key hashes on the contract which can be used to recover this wallet')
    .argument('<string>', 'the location of the key file')
    .action(async (fname: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const waiter: WaiterCallback = await lwm.call_setTenRecoveryPKHs()
        await processWaiterCallbackAndFiles(waiter, lwm, fname)
    })

program
    .command('recover')
    .description('recover a wallet using a recovery key')
    .argument('<string>', 'the location of the key file')
    .action(async (fname: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const waiter: WaiterCallback = await lwm.call_recover()
        await processWaiterCallbackAndFiles(waiter, lwm, fname)
    })

program
    .command('execute')
    .description('call the wallets execute function to execute arbitrary contract functions. Note that friond alies may not work in some cases while using this command.')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the address of the contract to call')
    .argument('<string>', 'the signature of the function to call (e.g. "transfer(address,uint256)")')
    .argument('<string>', 'the abi file of the contract to call')
    .argument('<string...>', 'arguments to be passed to the function call')
    .action(async (fname: string, address: string, fsig: string, abiFname: string, args: string[],) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)

        const fs = require('fs')
        const s = fs.readFileSync(abiFname, 'utf8')

        const obj = JSON.parse(s)
        const abi = obj.abi

        const waiter: WaiterCallback = await lwm.call_execute(address, fsig, args, abi)
        await processWaiterCallbackAndFiles(waiter, lwm, fname)
    })

program
    .command('transfer')
    .description('call the wallets execute function to execute arbitrary contract functions')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the address of the contract to call')
    .argument('<string>', 'the address to transfer to')
    .argument('<string>', 'the amount of tokens to transfer')
    .action(async (fname: string, address: string, to: string, amount: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const waiter: WaiterCallback = await lwm.call_execute(address, 'transfer(address,uint256)', [lwm.nameOrAddressToAddress(to), amount], erc20abi)
        await processWaiterCallbackAndFiles(waiter, lwm, fname)
    })

program
    .command('transfernft')
    .description('transfer an nft from the wallet')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the address of the nft contract')
    .argument('<string>', 'the token id')
    .argument('<string>', 'the address to send the token to')
    .action(async (fname: string, nftaddress: string, tokenId: string, to: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const waiter : WaiterCallback = await lwm.transferNft(nftaddress, tokenId, to)
        await processWaiterCallbackAndFiles(waiter, lwm, fname)
    })

program
    .command('ecdsasign')
    .description('sign a message using the ecdsa signing key.')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the message to sign')
    .action(async (fname: string, message: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        
        const sig = await lwm.eip1271Sign(message)
        process.stdout.write(`Signature: ${sig}\n`)

        // save to file system so user can do whatever they want with it
        const fs = require('fs')
        fs.writeFileSync(`signedmessages/${message.replace(/\s+/g, '')}_${lwm.state.walletAddress}_${lwm.state.chainId}.json`, JSON.stringify({ // TODO: double check this regular expression.. 
            signature: sig,
            message: message,
            scw_address: lwm.state.walletAddress,
            chainid: lwm.state.chainId,
            ts: Date.now()
        }, null, 2))
        process.stdout.write(`Signature saved in 'signedmessages' directory\n`)
    })

program
    .command('view')
    .description('view the current state of the wallet')
    .argument('<string>', 'the location of the key file')
    .action(async (fname: string) => {
        const timer = startTimer()
        const lwm: LamportWalletManager = loadLWMFile(fname)

        const promises_of_nsb = lwm.state?.currency_contracts?.map(c => lwm.getCurrencyInfo(c)) ?? []
        const promises_of_nsb_for_nft = lwm.state?.nft_contracts?.map(c => lwm.getNFTInfo(c)) ?? []

        {
            process.stdout.write('\nAddresses And Balances\n')
            const data: string[][] = []
            data.push(['Main Address', lwm.state.walletAddress])
            data.push(['Main Balance', await lwm.ethBalance()])
            data.push(['Gas Address', lwm.gasWalletAddress])
            data.push(['Gas Balance', await lwm.gasEthBalance()])
            data.push(['Signer Address', lwm.signingWalletAddress])
            data.push(['Signer Balance', await lwm.signingEthBalance()])
            formatOutput(data)
        }
        {
            process.stdout.write(`\nCurrencies\n`)
            const data: string[][] = []
            for (let i = 0; i < lwm.state.currency_contracts?.length ?? 0; i++) {
                const currency = lwm.state.currency_contracts[i]
                const [name, symbol, balance] = await promises_of_nsb[i]
                data.push([currency, name, symbol, balance.toString()])
            }
            formatOutput(data)
        }
        {
            process.stdout.write(`\nNFTs\n`)
            const data: string[][] = []
            for (let i = 0; i < lwm.state?.nft_contracts?.length ?? 0; i++) {
                const nft = lwm.state.nft_contracts[i]
                const [name, symbol, balance] = await promises_of_nsb_for_nft[i]
                data.push([nft, name, symbol, balance.toString()])
            }
            formatOutput(data)
        }
        {
            process.stdout.write('\nRecovery PKHs\n')
            const data: string[][] = []
            for (let i = 0; i < lwm.state.backup_keys.length; i++) {
                const key = lwm.state.backup_keys[i]
                const pkh = KeyTracker.pkhFromPublicKey(key.pub)
                data.push([pkh])
            }
            formatOutput(data)
        }
        {
            process.stdout.write('\nCurrent Public Key Hash\n')
            const data: string[][] = []
            data.push(['From Local Key File', lwm.state.kt.pkh])
            data.push(['From Blockchain', await lwm.pkh_fromChain()])
            formatOutput(data)
        }
        {
            process.stdout.write('\nFriends\n')
            const data: string[][] = []
            for (let i = 0; i < (lwm.state?.friends ?? []).length; i++) {
                const friend = lwm.state.friends[i]
                data.push([friend.name, friend.address])
            }
            formatOutput(data)
        }

        process.stdout.write(`\ntimer: ${timer()}s\n`)
    })

program
    .command('addcurrency')
    .description('add a currency to the wallet')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the address of the currency contract')
    .action(async (fname: string, address: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        lwm.addCurrency(address)
        saveLWMFile(lwm, fname)
    })

program
    .command('addnft')
    .description('add an nft contract to the wallet')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the address of the nft contract')
    .action(async (fname: string, address: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        lwm.addNFT(address)
        saveLWMFile(lwm, fname)
        process.stdout.write(`addnft - finished!\n`)
    })

program
    .command('addfriend')
    .description('add an alias to to an address')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the alias')
    .argument('<string>', 'the address')
    .action(async (fname: string, alias: string, address: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        lwm.addFriend(alias, address)
        saveLWMFile(lwm, fname)
        process.stdout.write(`addfriend - finished!\n`)
    })

program
    .command('viewnfts')
    .description('view the nfts in the wallet')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the address of the nft contract')
    .action(async (fname: string, address: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const myTokens : TokenInfo[] | null = await lwm.getMyTokens(address)
        if (myTokens === null) {
            process.stdout.write(`This Contract (${address}) Does Not Support ERC721Enumerable\n`)
            return
        }

        const data: string[][] = []
        myTokens.forEach((token : TokenInfo) =>    data.push([`Token ID`, token.tokenId.toString(), `Token URI`, token.tokenURI]))
        formatOutput(data)
    })

program
    .command('setgaseoa')
    .description('set the private key of the EOA used to pay gas fees')
    .argument('<string>', 'the location of the key file')
    .argument('<string>', 'the private key of the EOA used to pay gas fees')
    .action(async (fname: string, pk: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        lwm.setGasEOA(pk)
        saveLWMFile(lwm, fname)
        process.stdout.write(`${lwm.gasWalletAddress} is now responsable for paying your gas fees\n`)
    })

program
    .command('new')
    .description('Buy a new Lamport Wallet')
    .argument('<string>', 'Gas EOA private Key')
    .argument('<string>', 'name of blockchain to use')
    .action(async (gasKey: string, blockchain: string) => {
        const lwm: LamportWalletManager = await LamportWalletManager.buyNew(gasKey, blockchain)
        const fname = `walletfiles/new_wallet_${lwm.state.walletAddress}.json`
        saveLWMFile(lwm, fname)
        process.stdout.write(`Wallet File Saved at "${fname}"\n`)
    })

program.parse()