import * as d3 from 'd3';
import * as Pikaday from 'pikaday';
import './DateTimePicker.scss';
import 'pikaday/css/pikaday.css';
import { ChartComponent } from '../../Interfaces/ChartComponent';
import { entries } from 'd3';


class DateTimePicker extends ChartComponent{

    private calendar: any;
    private calendarPicker: any;
    private timeControls: any;
    private minMillis: number;
    private maxMillis: number;
    private fromMillis: number;
    private toMillis: number;
    private fromMinutes: number;
    private fromHours: number;
    private toMinutes: number;
    private toHours: number;
    private onSet: any;
    private targetElement: any;
    private isValid: boolean = true;

    private isSettingStartTime: boolean = true;
    private startRange;
    private endRange;
    private anchorDate;

    constructor(renderTarget: Element){
        super(renderTarget);
    }

    public render (chartOptions = {}, minMillis: number, maxMillis: number, 
                   fromMillis: number = null, toMillis: number = null, onSet = null) {
        this.minMillis = minMillis;
        this.maxMillis = maxMillis;
        if (toMillis == null) {
            toMillis = this.maxMillis;
        }
        if (fromMillis == null) {
            fromMillis = Math.max(toMillis - (24 * 60 * 60 * 1000), minMillis);
        }
        this.chartOptions.setOptions(chartOptions);
        this.fromMillis = fromMillis;
        this.toMillis = toMillis;
        this.onSet = onSet;
        this.targetElement = d3.select(this.renderTarget)
            .classed("tsi-dateTimePicker", true);
        super.themify(this.targetElement, this.chartOptions.theme);

        this.timeControls = this.targetElement.append("div").classed("tsi-timeControlsContainer", true);
        this.calendar = this.targetElement.append("div").classed("tsi-calendarPicker", true);
        var saveButtonContainer = this.targetElement.append("div").classed("tsi-saveButtonContainer", true);
        var saveButton = saveButtonContainer.append("button").classed("tsi-saveButton", true).html("Save")
            .on("click", () => {
                console.log(new Date(this.fromMillis));
                console.log(new Date(this.toMillis));
            });
        this.targetElement.append("div").classed("tsi-errorMessageContainer", true);
        this.createCalendar();
        this.calendarPicker.draw();
        this.createTimePicker();
        this.updateDisplayedFromDateTime();
        this.updateDisplayedToDateTime();
        this.startRange = new Date(this.fromMillis);
        this.endRange = new Date(this.toMillis);
        
        this.calendarPicker.draw();
        return;
    }
    //zero out everything but year, month and day
    private roundDay (d: Date) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    private setTimeRange (d: Date, isFromSelect: boolean) {
        if (this.isSettingStartTime) {
            this.calendarPicker.setStartRange(d);
            this.calendarPicker.setEndRange(null);
            this.startRange = d;
            this.anchorDate = d;
        }
        else {
            if (d.valueOf() > this.anchorDate.valueOf()) {
                if (isFromSelect) {
                    this.setFromDate(this.anchorDate);
                    this.setToDate(d);
                }
                this.calendarPicker.setEndRange(d);
                this.calendarPicker.setStartRange(this.anchorDate);
                this.startRange = this.anchorDate;
                this.endRange = d;
            } else {
                if (isFromSelect) {
                    this.setFromDate(d);
                    this.setToDate(this.anchorDate);
                }
                this.calendarPicker.setStartRange(d);
                this.calendarPicker.setEndRange(this.anchorDate);
                this.endRange = this.anchorDate;
                this.startRange = d;
            }
        }
    }

    private createCalendar () {
        var i18nOptions = {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['S','M','T','W','T','F','S']
        };

        this.calendarPicker = new Pikaday({ 
            bound: false,
            container: this.calendar.node(),
            field: this.calendar.node(),
            i18n: i18nOptions,
            numberOfMonths: 2,
            onSelect: (d) => {
                this.setTimeRange(d, true);
                // if (this.isSettingStartTime) {
                //     this.setFromDate(d);
                //     this.setFromDate(d);
                // } else {
                //     this.setToDate(d);
                // }
                this.isSettingStartTime = !this.isSettingStartTime;
                this.calendarPicker.draw();
            },
            onDraw: (d) => {
                if (this.isSettingStartTime)
                    return; 
                var self = this;
                this.calendar.select(".pika-single").selectAll(".pika-day").on("mouseover", function (d) { 
                    var date = new Date( Number(d3.select(this).attr("data-pika-year")),
                                         Number(d3.select(this).attr("data-pika-month")), 
                                         Number(d3.select(this).attr("data-pika-day")));
                    if (!self.isSettingStartTime) {
                        if (date.valueOf() < self.anchorDate.valueOf() && self.startRange.valueOf() != date.valueOf()) {
                            self.setTimeRange(date, false);
                            self.calendarPicker.draw();
                            return;
                        }
                        if (date.valueOf() >= self.anchorDate.valueOf() && (self.endRange == undefined || self.endRange.valueOf() != date.valueOf())) {
                            self.setTimeRange(date, false);
                            self.calendarPicker.draw();
                            return;
                        }
                    }
                });
            },
            minDate: this.offsetUTC(new Date(this.minMillis)),
            maxDate: this.offsetUTC(new Date(this.maxMillis))
        });
    }

    private setFromDate (d: Date) {
        var fromDate = new Date(this.fromMillis);
        fromDate.setUTCMonth(d.getMonth());
        fromDate.setUTCDate(d.getDate());
        this.setFromMillis(fromDate.valueOf());
    }

    private setToDate (d: Date) {
        var toDate = new Date(this.toMillis);
        toDate.setUTCMonth(d.getMonth());
        toDate.setUTCDate(d.getDate());
        this.setToMillis(toDate.valueOf());
    }

    private setIsValid (isValid: boolean){
        this.isValid = isValid;
        this.targetElement.select(".tsi-saveButtonContainer").select(".tsi-saveButton")
            .attr("disabled", this.isValid ? null : true)
            .classed("tsi-buttonDisabled", !this.isValid);

    }

    private setFromMillis (millis: number) {
        var rangeErrorCheck = this.rangeIsValid(millis, this.toMillis);
        this.fromMillis = millis;
        this.setIsValid(rangeErrorCheck.rangeIsValid);
        this.displayRangeErrors(rangeErrorCheck.errors);
    } 

    private setToMillis (millis: number) {
        var rangeErrorCheck = this.rangeIsValid(this.fromMillis, millis);
        this.toMillis = millis;
        this.setIsValid(rangeErrorCheck.rangeIsValid);

        this.displayRangeErrors(rangeErrorCheck.errors);
    }

    private displayRangeErrors (rangeErrors) {
        this.targetElement.select(".tsi-errorMessageContainer").selectAll(".tsi-errorMessage").remove();
        if (rangeErrors.length != 0) {
            this.targetElement.select(".tsi-errorMessageContainer").selectAll(".tsi-errorMessages")
                .data(rangeErrors)
                .enter()
                .append("div")
                .classed("tsi-errorMessage", true)
                .html(d => d);
        }
    }

    private rangeIsValid (prospectiveFromMillis: number, prospectiveToMillis: number) {
        var accumulatedErrors = [];
        var firstDateTime = new Date(this.minMillis);
        var firstTimeText = this.getUTCHours(firstDateTime) + ":" + 
                            (firstDateTime.getUTCMinutes() < 10 ? "0" : "") + String(firstDateTime.getUTCMinutes()) + " " + 
                            (firstDateTime.getUTCHours() < 12 ? "AM" : "PM");
        var lastDateTime = new Date(this.maxMillis);
        var lastTimeText = this.getUTCHours(lastDateTime) + ":" + 
                           (lastDateTime.getUTCMinutes() < 10 ? "0" : "") + String(lastDateTime.getUTCMinutes()) + " " +
                           (lastDateTime.getUTCHours() < 12 ? "AM" : "PM");

        if (prospectiveFromMillis > prospectiveToMillis) {
            accumulatedErrors.push("*From time must be before end time");
        }
        if (prospectiveFromMillis < this.minMillis) {
            accumulatedErrors.push("*From time is before first possible time (" + firstTimeText + ")");
        }
        if (prospectiveFromMillis > this.maxMillis) {
            accumulatedErrors.push("*From time is after last possible time (" + lastTimeText + ")");
        }
        if (prospectiveToMillis > this.maxMillis) {
            accumulatedErrors.push("*To time is after last possible time (" + lastTimeText + ")");            
        }
        if (prospectiveToMillis < this.minMillis) {
            accumulatedErrors.push("*To time is before first possible time (" + firstTimeText + ")");
        }
        return {
            rangeIsValid : (accumulatedErrors.length == 0),
            errors: accumulatedErrors
        };
    }

    private getUTCHours (d: Date) {
        var hours = d.getUTCHours();
        if (hours == 0) 
            hours = 12;
        if (hours > 12) 
            hours = hours - 12;
        return hours;
    }

    private updateDisplayedFromDateTime () {
        var fromDate = new Date(this.fromMillis);
        this.calendarPicker.setStartRange(this.roundDay(this.offsetUTC(fromDate)));
        var inputContainer = this.timeControls.select(".tsi-timeInputContainer").select(".tsi-startTimeInputContainer");
        var hours = this.getUTCHours(fromDate);
        inputContainer.select(".tsi-hoursInput").property("value", String(hours));
        var minutesString = (fromDate.getUTCMinutes() < 10 ? "0" : "") + String(fromDate.getUTCMinutes());
        inputContainer.select(".tsi-minutesInput").property("value", minutesString);
        inputContainer.select(".tsi-AMPMInput").property("value", fromDate.getUTCHours() < 12 ? "AM" : "PM");
    }

    private updateDisplayedToDateTime () {
        var toDate = new Date(this.toMillis);
        this.calendarPicker.setEndRange(this.roundDay(this.offsetUTC(toDate)));
        var inputContainer = this.timeControls.select(".tsi-timeInputContainer").select(".tsi-endTimeInputContainer");
        var hours = this.getUTCHours(toDate);
        inputContainer.select(".tsi-hoursInput").property("value", String(hours));
        var minutesString = (toDate.getUTCMinutes() < 10 ? "0" : "") + String(toDate.getUTCMinutes());
        inputContainer.select(".tsi-minutesInput").property("value", minutesString);
        inputContainer.select(".tsi-AMPMInput").property("value", toDate.getUTCHours() < 12 ? "AM" : "PM");
    }

    private offsetUTC (date: Date) {
        var dateCopy = new Date(date.valueOf())
        dateCopy.setTime( dateCopy.getTime() - dateCopy.getTimezoneOffset()*60*1000 );
        return dateCopy;
    }

    private offsetFromUTC(date: Date) {
        var dateCopy = new Date(date.valueOf())
        dateCopy.setTime( dateCopy.getTime() + dateCopy.getTimezoneOffset()*60*1000 );
        return dateCopy;    
    }

    private createTimePicker () {
        var timeInputContainer = this.timeControls.append("div").attr("class", "tsi-timeInputContainer");
        var createTimePicker = (startOrEnd) => {
            var self = this;
            var minutes = [];
            for (var i = 0; i < 60; i++) {
                var stringMinute = String(i);
                if (i < 10) {
                    stringMinute = "0" + stringMinute;
                }
                minutes.push(stringMinute);
            }
            var hours = [];
            for (var i = 1; i <= 12; i++) {
                hours.push(String(i));
            }
            var amPm = ["AM", "PM"];
            var fromOrToContainer = timeInputContainer.append("div").classed("tsi-" + startOrEnd + "Container", true);
            fromOrToContainer.append("h4").classed("tsi-timeLabel", true).html(startOrEnd + " Time");
            var startOrEndTimeContainer = fromOrToContainer.append("div").classed("tsi-" + startOrEnd + "TimeInputContainer", true);
            startOrEndTimeContainer.append("select").attr("class", "tsi-hoursInput")
                .on("change", function (d) {
                    var rawHours = Number(d3.select(this).property("value"));
                    var isPM = startOrEndTimeContainer.select(".tsi-AMPMInput").property("value") == "PM";
                    var hours = isPM ? (rawHours + 12) : rawHours;
                    hours = (hours == 12 || hours == 24) ? hours - 12 : hours;
                    if (startOrEnd == "start") {
                        var startDate = new Date(self.fromMillis);
                        startDate.setUTCHours(hours);
                        self.setFromMillis(startDate.valueOf());
                    } else {
                        var endDate = new Date(self.toMillis);
                        endDate.setUTCHours(hours);
                        self.setToMillis(endDate.valueOf());
                    }
                })
                .selectAll("option")
                .data(hours)
                .enter()
                .append('option')
                .text(d => d);
            startOrEndTimeContainer.append("select")
                .attr("class", "tsi-minutesInput")    
                .on("change", function (d) {
                    var minutes = Number(d3.select(this).property("value"));
                    if (startOrEnd == "start") {
                        var startDate = new Date(self.fromMillis);
                        startDate.setUTCMinutes(minutes);
                        self.setFromMillis(startDate.valueOf());
                    } else {
                        var endDate = new Date(self.toMillis);
                        endDate.setUTCMinutes(minutes);
                        self.setToMillis(endDate.valueOf());
                    }
                })
                .selectAll("option")
                .data(minutes)
                .enter()
                .append('option')
                .text(d => d);
            var amPmSelect = startOrEndTimeContainer.append("select");
            amPmSelect.attr("class", "tsi-AMPMInput")
                .on("change", function (d) {
                    var isPM = startOrEndTimeContainer.select(".tsi-AMPMInput").property("value") == "PM";
                    var rawHours = Number(startOrEndTimeContainer.select(".tsi-hoursInput").property("value"));
                    var isPM = d3.select(this).property("value") == "PM";
                    var hours = isPM ? (rawHours + 12) : rawHours;
                    hours = (hours == 12 || hours == 24) ? hours - 12 : hours;
                    if (startOrEnd == "start") {
                        var startDate = new Date(self.fromMillis);
                        startDate.setUTCHours(hours);
                        self.setFromMillis(startDate.valueOf());
                    } else {
                        var endDate = new Date(self.toMillis);
                        endDate.setUTCHours(hours);
                        self.setToMillis(endDate.valueOf());
                    }
                })
                .selectAll("option")
                .data(amPm)
                .enter()
                .append('option')
                .text(d => d);
        }

        createTimePicker("start");
        createTimePicker("end");
    }

}

export {DateTimePicker};