import { program } from 'commander'
import KeyTracker from './KeyTracker'
import LamportWalletManager from './LamportWalletManager'

const erc20abi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "friends",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
]

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
        await lwm.call_sendEther(address, amount)
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
            const [name, symbol, balance] = await lwm.getCurrencyInfo(currency)
            // const char : string = ['.', '_'][i % 2] 
            const char = '.'
            process.stdout.write(`\t${name.padEnd(M + (M / 2), char)}${symbol.padEnd(M, char)}${balance.toString().padEnd(N, char)}${currency}\n`)
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
    .command('new')
    .description('Buy a new Lamport Wallet')
    .argument('<string>', 'Gas EOA private Key')
    .argument('<string>', 'name of blockchain to use')
    .action(async (gasKey: string, blockchain:string) => {
        const lwm: LamportWalletManager = await LamportWalletManager.buyNew(gasKey, blockchain)
        saveLWMFile(lwm, `walletfiles/new_wallet_${lwm.state.walletAddress}.json`)
    })


program.parse()