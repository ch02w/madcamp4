import axios from 'axios';

const JWT = process.env.REACT_APP_PINATA_JWT;

export async function uploadIpfs(dataUrl: string) {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'sheet.png');

    const pinataMetadata = JSON.stringify({
      name: 'madcamp4',
      description: 'madcamp4',
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
      },
    );

    console.log(res.data);

    const body = {
      name: 'madcamp4',
      description: 'madcamp4_1분반',
      image: `ipfs://${res.data.IpfsHash}`,
      attributes: [{ trait_type: 'Unknown', value: 'Unknown' }],
    };

    const res2 = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      body,
      {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
      },
    );

    console.log(res2.data);
    return res2.data.IpfsHash;
  } catch (error) {
    console.error(error);
  }
}
