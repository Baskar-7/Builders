import { Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-msg-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './msg-box.component.html',
  styleUrl: './msg-box.component.scss'
})
export class MsgBoxComponent implements OnInit, OnChanges {

  @Input() statusMessage= { show: false, msg: '', status: '' };
  msgBox= { show: false, msg: '', status: '' };

  constructor(){}

  ngOnInit(): void {
    this.reset();
  }

  ngOnChanges(changes:  SimpleChanges): void {
    if (changes['statusMessage']) {
      setTimeout(() => {
        this.msgBox = {
          show: this.statusMessage.show ,
          msg: this.statusMessage.msg,
          status: this.statusMessage.status ,
        };
      }, 50);
      this.reset();
    }
  }

  reset()
  {
    this.msgBox = { show: false, msg: '', status: '' };
  }

  get iconClass(): string {
    return this.statusMessage.status === "success" ?  'fa fa-check-circle success' : this.statusMessage.status === "info" ? 'fa fa-info-circle infor' : 'fa fa-exclamation-triangle error' ;
  }

}
