Install: 

        npm install
    
Build: 

        npx tsc

Buy New Wallet:
    
        node javascript_build/main.js new <private key of gas paying EOA>

View Wallet Details:

        node javascript_build/main.js view <path to wallet file>

Add Currency: 

        node javascript_build/main.js addcurrency  <currency address>

Transfer ERC20 token:

        node javascript_build/main.js transfer <path to wallet file> <erc20 contract address> <address to send to> <amount to send>

Setup Recovery Keys:

        node javascript_build/main.js setrecovery <path to wallet file>

Recover Wallet:

        node javascript_build/main.js recover <path to wallet file>

Execute Complex Transactions:

        node javascript_build/main.js execute <path to wallet file> <contract address> <function signature> <path to contracts json file with abi> <...remainder of arguments are passed to complex function call>