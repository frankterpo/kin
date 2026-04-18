// 16-bit little-endian PCM mono @ 16 kHz.
// Posts ArrayBuffer chunks ~every 128 samples to the main thread.
class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Int16Array(4096);
    this._i = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const ch = input[0];
    for (let n = 0; n < ch.length; n++) {
      let s = Math.max(-1, Math.min(1, ch[n]));
      this._buf[this._i++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this._i === this._buf.length) {
        this.port.postMessage(this._buf.buffer.slice(0), [this._buf.buffer.slice(0)]);
        this._buf = new Int16Array(4096);
        this._i = 0;
      }
    }
    return true;
  }
}
registerProcessor("pcm-worklet", PCMWorklet);
