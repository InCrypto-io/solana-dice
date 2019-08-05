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

### Run the WebApp Front End and Backend Server
After building the program,

```sh
$ npm run start-server
```
And in other cmd line
```sh
$ npm run serve
```
