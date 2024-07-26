<aside>
⚔️ 300초마다 반복되는 전쟁과 평화. 270초 동안 치열하게 싸우고 30초 동안 전장을 정리하라!

</aside>

270/30은 참여형 인터랙티브 예술 캔버스 및 NFT 민팅 사이트입니다. 무슨 말인지 모르겠다구요? 예, 저희도요!

## Stack

- Front-end: React, Tailwind CSS
- Back-end: Nest.js
- Server: AWS EC2
- Smart Contract: Klaytn (solidity)

## Splash Screen

- Text-sparks 효과를 활용한 픽셀화된 splash screen이 보여집니다.
- Splash screen은 웹사이트에 새로 접속할 때마다 3초 간 나타납니다.

## Main Screen

- 메인 화면에는 불타오르는 예술혼을 상징하는 blob이 배경으로 보여집니다.
- CubeCanvas와 PixelSheet의 두 가지 페이지 중 하나를 골라 입장할 수 있습니다.
- 우측 하단의 채팅 버튼을 통해 다른 참여자와 익명으로 대화할 수 있습니다.

## Cube Canvas

- 200px × 200px × 200px 정육면체의 전개도와 3d view가 나란히 나타납니다.
- 사용자는 color picker를 통해 큐브 캔버스의 특정한 픽셀을 칠할 수 있습니다.
- 타이머가 30초 이하가 되면 캔버스 편집이 비활성화되며 rest phase에 진입합니다.
- Rest phase에서는 color picker 옆에 버튼이 나타납니다.
    - Download GLB: 큐브의 3d model을 .glb 파일로 다운로드할 수 있습니다.
    - NFT Minting: Kaikas 지갑 키를 추가하여 270초간 만들어진 큐브의 전개도를 NFT로 민팅할 수 있습니다.

## Pixel Sheet

- 격자의 가로는 박자, 세로는 음계를 나타냅니다.
- 음계를 추가할 때마다 하단의 악보에 실시간으로 반영됩니다. 같은 음이 연속될 경우, 긴음으로 변환됩니다.
- 상단의 버튼을 통해 파형 변경 (sine / square), 재생, bpm 변경 등의 작업을 할 수 있습니다.
    
- 30초가 남아 rest phase가 시작되면 NFT 민팅 버튼이 생겨나고, Kaikas 지갑 키를 추가하여 270초간 만들어진 악보를 NFT로 민팅할 수 있습니다.

## Technical Features

### Socket.io

- 서버 측에서 시간 정보, 채팅, 캔버스, 악보 등의 상태를 관리하고, 특정 메세지를 emit하여 클라이언트에게 전달하였습니다.

### NFT

- pinata api를 사용해 각 페이지의 전개도와 악보 파일을 (png) ipfs로 등록했습니다. 그 ipfs 파일의 해시를 등록한 ipfs 파일을 추가로 등록하여 한 파일 당 총 두 개의 ipfs 파일을 생성했습니다.
- Klaytn IDE를 사용하여 스마트 컨트랙트를 생성, 배포하고 abi와 contract address를 사용하여 클라이언트 측에서 직접 Kaikas 지갑 키를 추가하여 민팅할 수 있도록 구현했습니다.
- OpenSea testnet에서 Kaikas 지갑과 연동하여 민팅한 파일을 확인할 수 있습니다.

### Cube Canvas

- canvas를 grid로 배치하여 정육면체의 전개도를 표현했습니다.
- 웹소켓을 활용해 touch event를 받아 CRDT 방식의 캔버스 상태를 관리하였습니다.
- Three.js를 사용하여 3D 큐브 모델을 렌더링하여 전개도와 나란히 볼 수 있도록 했습니다.

### Pixel Sheet

- 웹소켓을 활용해 실시간으로 악보의 상태를 관리하였습니다.
- Vexflow library를 사용해 악보를 만들고 음표 추가, 색상 변경 등을 관리했습니다.
- tone.js library를 사용해 wav 파일을 추출하고 파형, bpm 등을 변경하여 실행했습니다.
