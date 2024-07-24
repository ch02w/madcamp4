import { uploadIpfs } from './uploadIpfs';
import { mintNFT } from './transaction';

export async function minting(url: string, privKey: string) {
  try {
    const ipfsHash = await uploadIpfs(url);
    await mintNFT(ipfsHash, privKey);
  } catch (error) {
    console.error('Error:', error);
  }
}