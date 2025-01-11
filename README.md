# Approach

Having never used used Noble nor Kepler. Naively, my first approach was to code the corrent flow:
1. Smart contract that stores USDC in Noble
2. Smart contract that stores USDC in Ethereum Sepolia
3. Dapp that connects to kepler and sends USDC to smart contract no.1 
4. Job that indexes noble tx of smart contract no. 1 and triggers a transfer smart contract -> recipient address (the mint)

This seemed too long of an approach to be done in couple of hours so I searched for a shorter way like here:


Noble Testnet RPC:
https://testnet.cosmos.directory/nobletestnet/nodes
https://rpc.testcosmos.directory/nobletestnet

Noble -> Eth bridging in typescript
https://github.com/circlefin/noble-cctp/blob/master/examples/depositForBurn.ts

https://github.com/cosmos/cosmos-sdk/issues/11997
https://github.com/b9lab/cosmjs-sandbox/pull/2
