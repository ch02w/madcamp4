import React, { useState } from 'react';
import { minting } from '../services/mintingService';

interface NFTMintingModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

const NFTMintingModal: React.FC<NFTMintingModalProps> = ({isOpen, onClose, url}) => {
  const [walletKey, setWalletKey] = useState('');

  if (!isOpen) return null;

  const onConfirm = (walletKey: string) => {
    minting(url, walletKey);
    onClose();
  }

  return (
    <div className="nft-minting-modal" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'white', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', width: '300px'
      }}>
        <h2>NFT minting</h2>
        <input
          type="text"
          placeholder="Enter Kaikas wallet key"
          value={walletKey}
          onChange={(e) => setWalletKey(e.target.value)}
          style={{ margin: '10px 0', padding: '10px', width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button onClick={onClose} style={{
            backgroundColor: 'red', color: 'white', padding: '10px', borderRadius: '5px', flex: '1', margin: '0 5px'
          }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(walletKey)} style={{
            backgroundColor: 'green', color: 'white', padding: '10px', borderRadius: '5px', flex: '1', margin: '0 5px'
          }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default NFTMintingModal;
