# go through all the things that we can do with the cli
npx tsc

# npm start new <gas private key> sepolia

# view everything
npm start view "walletfiles/lwm3.json"

# send eth
# npm start sendeth "walletfiles/lwm3.json" pgtest 123456

# set recovery
# npm start setrecovery "walletfiles/lwm3.json"

# recover
# npm start recover "walletfiles/lwm3.json"

# transfer 
# npm start transfer "walletfiles/lwm3.json" ccents pgtest 123456

# execute 
# npm start execute "walletfiles/lwm3.json" ccents "transfer(address,uint256)" Dollar.json 0x94D4Da7bDe814ae3B7a3D25A108391018e1e495E 654321

# transfer nft
npm start transfernft "walletfiles/lwm3.json" lab 168 pgtest