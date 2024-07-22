import { uploadIpfs } from './uploadIpfs';
import { mintNFT } from './transaction';

export async function minting() {
  try {
    const ipfsHash = await uploadIpfs();
    await mintNFT(ipfsHash);
  } catch (error) {
    console.error('Error:', error);
  }
}