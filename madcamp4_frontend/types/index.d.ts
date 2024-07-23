declare module 'react-mouse-particles' {
    import { Component } from 'react';
    interface MouseParticlesProps {
      g?: number;
      color?: string;
      cull?: string;
      style?: React.CSSProperties;
    }
    export default class MouseParticles extends Component<MouseParticlesProps> {}
  }
  