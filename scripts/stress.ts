import yargs from 'yargs/yargs';
import dotenv from 'dotenv';
import { ethers, Wallet } from 'ethers';
dotenv.config();

async function Stress() {
  const { delay, layer, wait } = argv;
  const provider = initProvider(layer as IChainName);
  if (!process.env.STRESS_PK_KEY) {
    throw new Error('For sress require sender private key');
  }
  const sender = new Wallet(process.env.STRESS_PK_KEY, provider);

  console.log(`------ RUN STRESS to ${layer} chain | delay(ms) ${delay} ------`);
  
  // 여기닷
  for (;;) {
    const response = await sender.sendTransaction({
      type: 0,
      to: sender.address,
      value: 0,
    });
    if (wait) {
       await response.wait();
    }
    if (delay > 0) {
      await new Promise((f) => setTimeout(f, delay));
    }
  }
}

export type IChainName = 'ETH' | 'ARB' | 'DKA';
const initProvider = (chain: IChainName) => {
  const providers = {
    ETH: new ethers.providers.JsonRpcProvider(process.env.ETH_URL),
    ARB: new ethers.providers.JsonRpcProvider(process.env.ARB_URL),
    DKA: new ethers.providers.JsonRpcProvider(process.env.DKA_URL),
  };

  return providers[chain];
};

const argv = yargs(process.argv.slice(2))
  .options({
    wait: { boolean: true, default: true },
    delay: { number: true, description: 'delay between repeats (ms)', default: 1000 },
    layer: { choices: ['ETH', 'ARB', 'DKA'], default: 'ARB' },
  })
  .parseSync();

void Stress();
