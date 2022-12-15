
# Requirements
- Node (https://nodejs.org/en/download/)
- A funded EOA to pay gas fees

# Setup
1. clone this repo
2. run `npm i` to install the dependencies 
3. run `npx tsc` to build
4. run `npm start <command name> <arguments>` to interact with the contracts

# Purchasing New Wallet
    npm start new <gas paying EOA private key> <chain name>

# View Wallet Details
    npm start view <path to wallet file>

# Send Ether
    npm start sendeth <path to wallet file> <recipient address> <amount to send in wei>

# Set Recovery Keys
    npm start setrecovery <path to wallet file>

# Use Recovery Keys
    npm start recover <path to wallet file>

# Execute Arbitrary Calls Via Anchor Wallet
    npm start execute <path to wallet file> <address of contract to call> <signature of function to call> <json file describing contract> <arguments to pass to function call>

# Transfer an ERC721 token
    npm start transfernft <path to wallet file> <NFT contract address> <token id> <recipient address>

# Transfer an ERC20 token
    npm start transfer <path to wallet file> <address of token contract> <amount to send>

# Add an ERC20 contract to track
    npm start addcurrency <path to wallet file> <address of token contract>

# Add an ERC721 contract to track
    npm start addnft <path to wallet file> <address of token contract>

# Add A friend / address alias 
    npm start addfriend <path to wallet file> <alias> <address>

# View NFTs
    npm start viewnfts <path to wallet file> <NFT contract address>

# Set Gas Wallet
    npm start setgaseoa <path to wallet file> <gas paying private key>

