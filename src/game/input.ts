export interface InputState {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
}

export class InputController {
  private keys = new Set<string>();
  private touchState: InputState = {
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    handbrake: false,
  };
  private onPauseToggle?: () => void;

  constructor(onPauseToggle?: () => void) {
    this.onPauseToggle = onPauseToggle;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key) ||
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
    ) {
      e.preventDefault();
    }

    if (e.code === 'Escape' || e.key === 'Escape') {
      e.preventDefault();
      if (!e.repeat && this.onPauseToggle) {
        this.onPauseToggle();
      }
      return;
    }

    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private handleBlur = () => {
    this.keys.clear();
    this.touchState = {
      accelerate: false,
      brake: false,
      left: false,
      right: false,
      handbrake: false,
    };
  };

  attach() {
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.keys.clear();
  }

  setTouchButton(button: keyof InputState, pressed: boolean) {
    this.touchState[button] = pressed;
  }

  getState(): InputState {
    return {
      accelerate:
        this.keys.has('ArrowUp') ||
        this.keys.has('KeyW') ||
        this.touchState.accelerate,
      brake:
        this.keys.has('ArrowDown') ||
        this.keys.has('KeyS') ||
        this.touchState.brake,
      left:
        this.keys.has('ArrowLeft') ||
        this.keys.has('KeyA') ||
        this.touchState.left,
      right:
        this.keys.has('ArrowRight') ||
        this.keys.has('KeyD') ||
        this.touchState.right,
      handbrake:
        this.keys.has('Space') ||
        this.touchState.handbrake,
    };
  }
}
