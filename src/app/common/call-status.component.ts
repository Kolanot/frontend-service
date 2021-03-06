/**
 * Created by suat on 29-Sep-17.
 */
import {
    Component, DoCheck, ElementRef, Input, OnInit, ViewChild
} from "@angular/core";
import {CallStatus} from "./call-status";

@Component({
    selector: 'call-status',
    templateUrl: './call-status.component.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
})

export class CallStatusComponent implements OnInit {
    @ViewChild('errorBox') errorBox: ElementRef;
    @ViewChild('successBox') successBox: ElementRef;

    @Input() callStatus:CallStatus;
    // if true adds the alert class to the component for top and bottom padding
    @Input() large:boolean;
    showDetails: boolean[] = [];

    ngOnInit(): void {
        if (this.callStatus.aggregatedErrors) {
            for (let error of this.callStatus.aggregatedErrors) {
                this.showDetails.push(false);
            }
        }
    }

    isLoadingIconHidden(): boolean {
        return this.callStatus.callCount === 0 || this.callStatus.isAllComplete();
    }

    handleClick(event){
        // if the call is still active, ignore click
        if(this.callStatus.fb_submitted == true) {
            return;
        }

        var clickedComponent = event.target;
        var inside = false;
        do {
            // null check on the element refs in case they might not be rendered at all
            if ((this.errorBox != null && clickedComponent === this.errorBox.nativeElement) ||
                (this.successBox != null && clickedComponent === this.successBox.nativeElement)) {
                inside = true;
                break;
            }
            clickedComponent = clickedComponent.parentNode;
        } while (clickedComponent);

        // if successful and outside the box, reset the status
        /*if(!inside && this.callStatus.fb_callback == true) {
            this.callStatus.reset();
        }
        if(!inside && this.callStatus.fb_errordetc == true) {
            //this.callStatus.reset();
        }*/
    }
}
