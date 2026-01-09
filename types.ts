export enum ConnectionType {
  SERIES = 'SERIES',
  PARALLEL = 'PARALLEL'
}

export interface CircuitState {
  batteryCount: number;
  connectionType: ConnectionType;
  isSwitchClosed: boolean;
}

export interface SimulationStats {
  voltage: number; // Volts
  current: number; // Amperes (arbitrary scale)
  brightness: number; // 0 to 1 scale
}