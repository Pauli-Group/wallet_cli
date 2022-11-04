Things this repo does: 
- [x] buy a new Lamport Wallet
- [x] View Wallet Details
- [x] track an erc20 currency
- [x] send funds in ether
- [x] send funds in any erc20
- [x] setup recovery keys
- [x] recover a wallet with recovery keys
- [x] execute arbitrary function calls on the blockchain


Install: 

    npm install
    
Build: 

    npx tsc

Buy New Wallet:
    
    node main.js new <private key of gas paying EOA>

View Wallet Details:

    node main.js view <path to wallet file>

Add Currency: 

    node main.js addcurrency  <currency address>

Transfer ERC20 token:

    node main.js transfer <path to wallet file> <erc20 contract address> <address to send to> <amount to send>

Setup Recovery Keys:

    node main.js setrecovery <path to wallet file>

Recover Wallet:

    node main.js recover <path to wallet file>

Execute Complex Transactions:

    node main.js execute <path to wallet file> <contract address> <function signature> <path to contracts json file with abi> <...remainder of arguments are passed to complex function call>