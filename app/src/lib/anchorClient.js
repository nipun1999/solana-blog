import * as anchor from '@project-serum/anchor'; // includes https://solana-labs.github.io/solana-web3.js/
const { SystemProgram } = anchor.web3; // Added to initialize account

// .. [snip]

export default class AnchorClient {
	constructor({ programId, config, keypair } = {}) {
		this.programId = programId || getDevPgmId();
		this.config = config || solConfigFile.development.config;
		this.connection = new anchor.web3.Connection(this.config.httpUri, 'confirmed');
		console.log('\n\nConnected to', this.config.httpUri);

		const wallet =
			window.solana.isConnected && window.solana?.isPhantom
				? new WalletAdaptorPhantom()
				: keypair
				? new anchor.Wallet(keypair)
				: new anchor.Wallet(anchor.web3.Keypair.generate());
		// maps anchor calls to Phantom direction
		this.provider = new anchor.Provider(this.connection, wallet, opts);
		this.program = new anchor.Program(idl, this.programId, this.provider);
	}

  async initialize() {
    // generate an address (PublciKey) for this new account
    let blogAccount = anchor.web3.Keypair.generate(); // blogAccount is type Keypair

    // Execute the RPC call
    const tx = await this.program.rpc.initialize({
      // Pass in all the accounts needed
      accounts: {
        blogAccount: blogAccount.publicKey, // publickey for our new account
        authority: this.provider.wallet.publicKey, // publickey of our anchor wallet provider
        systemProgram: SystemProgram.programId // just for Anchor reference
      },
      signers: [blogAccount] // blogAccount must sign this Tx, to prove we have the private key too
    });
    console.log(
      `Successfully intialized Blog ID: ${blogAccount.publicKey} for Blogger ${this.provider.wallet.publicKey}`
    );
    return blogAccount;
  }


  async makePost(post, blogAccountStr) {
    // convert our string to PublicKey type
    let blogAccount = new anchor.web3.PublicKey(blogAccountStr);

    const utf8encoded = Buffer.from(post); // anchor library doesn't like UInt8Array, so we use Nodejs buffer here

    // Execute the RPC.
    const tx = await this.program.rpc.makePost(
      // input must be compatible with UTF8 Vector in rust
      utf8encoded,
      // now pass the accounts in
      {
        accounts: {
          blogAccount: blogAccount, // needs to be the same publicKey as init, or it won't work
          authority: this.program.provider.wallet.publicKey // needs to be the same publicKey as init, or it won't work
        },
        signers: [this.program.provider.wallet.payer] // needs to be the same keyPAIR as init, or it won't work
      }
    );
    console.log(
      `Successfully posted ${post} to https://explorer.solana.com/address/${blogAccount}?cluster=devnet`
    );
    return tx;
  }
}