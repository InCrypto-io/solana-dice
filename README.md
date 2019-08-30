### Dice on Solana

This project demonstrates how to use the [Solana Javascript API](https://github.com/solana-labs/solana-web3.js) and interact with [webwallet](https://github.com/solana-labs/example-webwallet).
See [example](src/util/wallet.js).

### Setup
```sh
$ npm i
```
### Build the BPF C program
```sh
$ V=1 make -C program-bpf
```
or
```
$ npm run build:bpf-с
```

### Configure your endpoint URL's
```
url - node rpc URL
backendURL - backend URL
walletURL - wallet URL
```

### Run the WebApp Front End and Backend Server
After building the program,

```sh
$ npm run start-server
```
And in other cmd line
```sh
$ npm run serve
```

### For administration see [postman collection](https://documenter.getpostman.com/view/8629027/SVfRtnms?version=latest)