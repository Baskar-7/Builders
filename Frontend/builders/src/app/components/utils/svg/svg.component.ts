import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-svg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg.component.html',
  styleUrl: './svg.component.scss'
})
export class SvgComponent {

  @Input() svgType: string = '';
  @Input() color: string = '';
  @Input() width: number = 100;
  @Input() height: number = 100;
  @Input() fontSize: number  = 0;

}
