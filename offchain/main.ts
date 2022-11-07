import { program } from 'commander'
import KeyTracker from './KeyTracker'
import LamportWalletManager from './LamportWalletManager'
import * as _erc20abi from '../abi/erc20abi.json'

const erc20abi = _erc20abi.default

function loadLWMFile(fname: string): LamportWalletManager {
    const fs = require('fs')
    const s = fs.readFileSync(fname, 'utf8')
    const lwm = LamportWalletManager.fromJSON(s)
    return lwm
}

function saveLWMFile(lwm: LamportWalletManager, fname: string) {
    const s = lwm.toJSON()
    const fs = require('fs')
    fs.writeFileSync(fname, s)
}

const startTimer = () => {
    const start = new Date().getTime()
    return () => {
        const end = new Date().getTime()
        return (end - start) / 1000
    }
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
        const tx_hash = await lwm.call_sendEther(address, amount)
        process.stdout.write(`Transaction Hash: ${tx_hash}\n`)
        saveLWMFile(lwm, fname)
    })

program
    .command('setrecovery')
    .description('set ten public key hashes on the contract which can be used to recover this wallet')
    .argument('<string>', 'the location of the key file')
    .action(async (fname: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        await lwm.call_setTenRecoveryPKHs()
        saveLWMFile(lwm, fname)
    })

program
    .command('recover')
    .description('recover a wallet using a recovery key')
    .argument('<string>', 'the location of the key file')
    .action(async (fname: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        await lwm.call_recover()
        saveLWMFile(lwm, fname)
    })

program
    .command('execute')
    .description('call the wallets execute function to execute arbitrary contract functions')
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

        await lwm.call_execute(address, fsig, args, abi)
        saveLWMFile(lwm, fname)
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
        await lwm.call_execute(address, 'transfer(address,uint256)', [to, amount], erc20abi)
        saveLWMFile(lwm, fname)
    })



program
    .command('view')
    .description('view the current state of the wallet')
    .argument('<string>', 'the location of the key file')
    .action(async (fname: string) => {
        const lwm: LamportWalletManager = loadLWMFile(fname)
        const timer = startTimer()

        
        const promises_of_nsb = (lwm.state.currency_contracts.map(
            async (c) => {
                const [name, symbol, balance] = await lwm.getCurrencyInfo(c)
                return [name, symbol, balance]
            }
        ))

        const promises_of_nsb_for_nft = (lwm.state.nft_contracts.map(
            (c) => lwm.getNFTInfo(c)
        ))

        const N = 60
        const M = 15

        const row = (a: string, b: string) => process.stdout.write(`${a.padEnd(M, '.')}${b.padStart(N, '.')}\n`)
        row('address', lwm.state.walletAddress)

        const balance = await lwm.ethBalance()
        row('balance', balance)

        process.stdout.write('\n')

        const gasAddress = lwm.gasWalletAddress
        row('gas address', gasAddress)

        const gasBalance = await lwm.gasEthBalance()
        row('gas balance', gasBalance)

        process.stdout.write('\n')

        const signerAddress = lwm.signingWalletAddress
        row('signer address', signerAddress)

        const signerBalance = await lwm.signingEthBalance()
        row('signer balance', signerBalance)

        process.stdout.write('\n')

        process.stdout.write(`Currencies\n`)


        for (let i = 0; i < lwm.state.currency_contracts.length; i++) {
            const currency = lwm.state.currency_contracts[i]
            const [name, symbol, balance] = await promises_of_nsb[i]
            const char = '.'
            process.stdout.write(`\t${name.padEnd(M + (M / 2), char)}${symbol.padEnd(M, char)}${balance.toString().padEnd(N, char)}${currency}\n`)
        }

        process.stdout.write(`\n`)
        process.stdout.write(`NFTs\n`)
        
        for (let i = 0; i < lwm.state?.nft_contracts?.length ?? 0; i++) {
            const nft = lwm.state.nft_contracts[i]
            const [name, symbol, balance, tokenInfo] = await promises_of_nsb_for_nft[i]
            process.stdout.write(`\t${name.padEnd(M + (M / 2), '.')} ${symbol.padEnd(M, '.')} ${balance.toString().padEnd(N, '.')} ${nft}\n`)
            for (let i = 0; i < tokenInfo.length; i++) 
                process.stdout.write(`\t\t${tokenInfo[i].tokenId}\t\t${tokenInfo[i].tokenURI}\n`)
        }

        process.stdout.write('\n')
        process.stdout.write('Recovery PKHs\n')

        for (let i = 0; i < lwm.state.backup_keys.length; i++) {
            const key = lwm.state.backup_keys[i]
            const pkh = KeyTracker.pkhFromPublicKey(key.pub)
            process.stdout.write(`\t${`${i + 1}.`.padEnd(4)}${pkh}\n`)
        }

        process.stdout.write('\n')
        {
            const currentPKH = lwm.state.kt.pkh
            row('current pkh', currentPKH)
        }
        {
            const currentPKH = await lwm.pkh_fromChain()
            row('current pkh', currentPKH)
        }

        process.stdout.write('\n')
        process.stdout.write(`timer: ${timer()}s\n`)
        process.stdout.write('\n')
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
    .command('new')
    .description('Buy a new Lamport Wallet')
    .argument('<string>', 'Gas EOA private Key')
    .argument('<string>', 'name of blockchain to use')
    .action(async (gasKey: string, blockchain: string) => {
        const lwm: LamportWalletManager = await LamportWalletManager.buyNew(gasKey, blockchain)
        saveLWMFile(lwm, `walletfiles/new_wallet_${lwm.state.walletAddress}.json`)
    })


program.parse()