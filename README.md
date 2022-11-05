Things this repo does: 
- [x] buy a new Lamport Wallet
- [x] View Wallet Details
- [x] track an erc20 currency
- [x] send funds in ether
- [x] send funds in any erc20
- [x] setup recovery keys
- [x] recover a wallet with recovery keys
- [x] execute arbitrary function calls on the blockchain

Planned Features:
- [ ] support multiple blockchains (deploy factory + add to supportedBlockchains.json)
- [ ] maintain a list of "friends" to alias addresses with names
- [ ] sign messages as specified by EIP-1271
- [ ] verify signatures as specified by EIP-1271 for other wallets 
- [ ] track an NFT (ERC721) contract
- [ ] see a list of known NFTs in my wallet - broken down by contract, showing token id and url
- [ ] send an NFT (ERC721) to another wallet
- [ ] change gas wallet

Install: 

    npm install
    
Build: 

    npx tsc

Buy New Wallet:
    
    npm start new <private key of gas paying EOA>

View Wallet Details:

    npm start view <path to wallet file>

Add Currency: 

    npm start addcurrency  <currency address>

Transfer ERC20 token:

    npm start transfer <path to wallet file> <erc20 contract address> <address to send to> <amount to send>

Setup Recovery Keys:

    npm start setrecovery <path to wallet file>

Recover Wallet:

    npm start recover <path to wallet file>

Execute Complex Transactions:

    npm start execute <path to wallet file> <contract address> <function signature> <path to contracts json file with abi> <...remainder of arguments are passed to complex function call>

To View The Documentation For A Command:
    
    npm start help <command name>

To Change The RPC Endpoint (potentially to your own full node):

    edit the `rpc` field of the relevent blockchain in supportedBlockchains.json and rebuild with `npx tsc`