import { Component } from '@angular/core';

@Component({
  selector: 'app-educacion',
  templateUrl: './educacion.component.html',
  styleUrls: ['./educacion.component.css'] 
})
export class EducacionComponent {
  selectedComponent: string = 'Educación'; 

  setSelected(item: string) {
    this.selectedComponent = item;
  }
}
