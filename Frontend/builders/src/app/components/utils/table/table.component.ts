import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MultiConditionPipe } from '../../../pipes/multi-condition.pipe';
import { CommonModule } from '@angular/common';

import $ from 'jquery';

//Layout Object Examples and usages

//1.[actions]     actions: ['upgrade', 'delete', 'degrade']
//explanation:- The actions specified in the array will correspond to their respective action icons, which can be triggered based on the available actions.

//2.[actionsFOr]  actionsFor: { 'upgrade': { 'Acc Type': 'User' }, 'delete' : {'Acc Type' : 'Host'} } 
//explanation:-  The 'upgrade' action applies when the value of the 'Acc Type' column is 'User', while the 'delete' action applies when the value of 'Acc Type' is 'Host'. 




//4.[sortingOrder]   sortingOrder : true;  
//explanation:- defines the column is in descending or ascending order

//5.[sortColumn]  sortColumn : 'Name' 
//explanation:-  Indicate to the user with an up or down caret icon that the "Name" column is sorted according to the sortingOrder.

//6.[sortArray]   sortArray: ['Name', 'Acc Type']  
//explanation:- where 'Name' is a colum that should be marked as Sorting column where the user can click the column header to sort the column values
           
//7.[canSearch]  canSearch: true
//explanation:- Toggles Search option based on the canSearch value

//8.[cols]   cols : [{columnDispName :'Name', column : 'name'},{columnDispName: 'Acc Type', column : 'acc_type' }]
//explanation:- Add colum header based on the array of objects 

//9.[label] lable: 'HostActions' 
//explanation:- Where it used to make the id used with filters and others as unique when more than one table is used in the single page.

//10.[filterList] filterList : ['User','Host'] 
//explanation:- where it is a dropdown content to filter the table data

//11.[filterValue] filterValue: 'User'
//explanation:- where it is a current triggered filter option

//12.[add_new]  add_new: true
//explanation:- where it is used to toggle the insert new row or values option based on the boolean value



interface Layouts{
  actions : any[], 
  actionsFor : {[key:string] : any },
  sortingOrder : boolean,
  sortColumn : string,
  sortArray : any[],
  canSearch : boolean,
  searchVal : any,
  cols : any[],
  label : string,
  filterList : any[],
  filterValue : string,
  add_new : boolean
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule,MultiConditionPipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent {

  constructor(private cdr: ChangeDetectorRef){}

  @Output() handleActions = new EventEmitter<any>();
  @Output() layoutChange = new EventEmitter<any>();
  @Output() contentChange = new EventEmitter<any>();
  @Input() content :any[] = [];
  @Input() layout: Layouts ={
      actions : [],
      actionsFor : [],
      sortingOrder : false,
      sortColumn : "",
      sortArray : [],
      canSearch : false,
      searchVal : '',
      cols : [{columnDispName : '',column : ''}],
      label : "",
      filterList : [],
      filterValue : '',
      add_new : false
  }

  toggleDropdown(event: Event) {
    var dropdown = $('.dropdown');
    dropdown.toggleClass('active');
    if (event.type == 'focusout') {
      dropdown.find('.dropdown-menu').slideUp(300);
    } else {
      dropdown.find('.dropdown-menu').slideToggle(300);
    }
  }

  search(event: Event)
  { 
    var ele = event.target as HTMLInputElement;
    this.layout.searchVal = ele.value.trim().replace(/[^a-zA-Z0-9 ]/g, "");
    ele = this.layout.searchVal;
    this.handleActions.emit({"actionName" : "refresh", "param" : ''});
  }

  sortBy(columnName: string)
  {
    if(this.layout.sortArray.includes(columnName))
    {
        this.layout.sortingOrder = !this.layout.sortingOrder;
    }
    else {
      this.layout.sortingOrder = true;
    }
    this.layout.sortColumn = columnName;
    this.handleActions.emit({"actionName" : "refresh", param : ''});
  }

  filterBy(event : Event)
  {
    var ele = event.target as HTMLElement, filter = ele.id;
    this.layout.filterValue = filter;
    this.toggleDropdown(event)
    this.handleActions.emit({"actionName": "refresh", param : ''});
  }

  shouldDisplayAction(actionName: string, content: any) {
    var actionsFor = this.layout.actionsFor; 
    if (actionsFor && this.layout.actionsFor[actionName]) {
      var pair = this.layout.actionsFor[actionName]; 
      var key = Object.keys(pair)[0]; 
      if (content[key] == pair[key]) return true;
      else return false;
    } else if (this.layout.actions.includes(actionName)) {
      return true;
    } else {
      return false;
    }
  }

  handleAction(actionName: string,param : any,event: Event)
  {
    event.preventDefault();
    this.handleActions.emit({"actionName" : actionName ,"param" : param })
  } 
}
