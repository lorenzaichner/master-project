import $ from 'jquery';

export class StatusLine {
  css: Record<string, unknown> = {
    position: 'fixed',
    bottom: '0px',
    'background-color': 'green',
    color: 'white',
    right: '0px',
    'padding-left': '15px',
    'padding-right': '15px',
  };

  statusMessage = 'idle';

  constructor() {
    //
  }

  public setStatus(status: string): void {
    $("#status-line-wrapper").css({
      'background-color': 'green',
    });
    this.statusMessage = status;
  }

  public setError(errorStatus: string) {
    $("#status-line-wrapper").css({
      'background-color': 'red',
    });
    this.statusMessage = errorStatus;
  }

  public noStatus(): void {
    this.statusMessage = 'idle';
  }

}
