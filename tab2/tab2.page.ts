import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef ,ChangeDetectorRef } from '@angular/core';
declare var Draggable: any;

  export class ThermostatSimple {
    
    el: HTMLElement | null;
    temp: number;
    tempMin: number;
    tempMax: number;
    fizz: HTMLCanvasElement | null;
    fizzParticleCount: number;
    fizzParticles: any[];
    fc: CanvasRenderingContext2D | null;
    fW: number;
    fH: number;
    fS: number;
    // HomePage 클래스의 참조를 저장하기 위한 변수
    tab2PageRef: Tab2Page | null;
    identifier: string;

      // 인스턴스별 상태를 저장하는 프로퍼티 추가
    public settingTemp: number;
    public currentTemp: number;
    constructor(elementOrSelector: HTMLElement | string, tab2Page: Tab2Page, settingTemp: number = 0, currentTemp: number = 0, identifier: string){
      if (typeof elementOrSelector === 'string') {
        // If a string is passed, use it as a selector to find the element
        this.el = document.querySelector(elementOrSelector);
        console.log('String',this.el)
      } else {
        // If an HTMLElement is passed, use it directly
        this.el = elementOrSelector;
        console.log(elementOrSelector)
      }
      this.temp = 0;
      this.tempMin = 0;
      this.tempMax = 60;
      this.fizz = null;
      this.fizzParticleCount = 600;
      this.fizzParticles = [];
      this.fc = null;
      this.fW = 240;
      this.fH = 240;
      this.fS = window.devicePixelRatio;
      // 각 인스턴스의 초기 온도 설정
    this.settingTemp = settingTemp;
    this.currentTemp = currentTemp;
    this.tab2PageRef = tab2Page;
    this.identifier = identifier;
    console.log(`Creating instance for ThermostatSimple: ${this.identifier}`); // 식별자 로깅
      this.init();
      // HomePage 클래스의 참조를 저장
  }


  init() {
    console.log("init Tab2");

    if (this.el) {
        this.fizz = this.el.querySelector(".temp__fizz") as HTMLCanvasElement | null;
        if (this.fizz) {
            this.fc = this.fizz.getContext("2d");

            let f = this.fizzParticleCount;

            while (f--) {
                this.fizzParticles.push({
                    radius: 1,
                    minDist: this.randInt(100, 115),
                    maxDist: this.randInt(85, 115),
                    minRot: this.randInt(-180, 180),
                    maxRot: this.randInt(-180, 180),
                    x: 0,
                    y: 0
                });
            }

            this.fizz.width = this.fW * this.fS;
            this.fizz.height = this.fH * this.fS;
            if (this.fc) {
                this.fc.scale(this.fS, this.fS);
            }
        }
    }

    // Draggable.create(".temp__dial", {
    //     type: "rotation",
    //     bounds: {
    //         minRotation: 0,
    //         maxRotation: 359
    //     },
    //     onDrag: () => {
    //         this.tempAdjust("drag");
    //     },
    //     onDragEnd: () => {
    //       this.tempAdjust("send");
    //     }

    // });
  }


  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  randInt(min: number, max: number): number {
    return Math.round(Math.random() * (max - min)) + min;
  }

  angleFromMatrix(transVal: string): number {
    console.log("Transform value:", transVal); // 'trans' 대신 'transVal'로 변경
    if (transVal === 'none') {
      return 0; // 또는 초기 각도 설정이 필요한 경우 해당 값을 반환합니다.
    }
    let matrixVal = transVal.split('(')[1].split(')')[0].split(','),
        //[cos1, sin] = matrixVal.slice(0, 2),
        cos1 = parseFloat(matrixVal[0]),  // 문자열을 숫자로 변환
        sin = parseFloat(matrixVal[1]),   // 문자열을 숫자로 변환
        angle = Math.round(Math.atan2(sin, cos1) * (180 / Math.PI)) * -1;

    if (angle < 0)
        angle += 360;

    if (angle > 0)
        angle = 360 - angle;

    return angle;
  }

  tempAdjust(inputVal: string | number) {
    if (this.el) {
      let cs = window.getComputedStyle(this.el),
      tempDisplay = this.el.querySelector(".temp__value"),
      tempDial = this.el.querySelector(".temp__dial") as HTMLElement,
      tempRange = this.tempMax - this.tempMin,
      hueStart = 240,  // 숫자로 정의
      hueEnd = 360,    // 숫자로 정의
      hueRange = hueEnd - hueStart,
      notDragged = inputVal !== "drag";


        if (typeof inputVal === "number") {
            this.temp = inputVal;
        } else if (inputVal === "drag" && tempDial) {
            let tempDialCS = window.getComputedStyle(tempDial),
                trans = tempDialCS.getPropertyValue("transform"),
                angle = this.angleFromMatrix(trans);

            this.temp = (angle / 360) * tempRange + this.tempMin;

        }

        if (this.temp < this.tempMin)
            this.temp = this.tempMin;
        else if (this.temp > this.tempMax)
            this.temp = this.tempMax;

        if (notDragged)
            this.temp = Math.round(this.temp);

        let relTemp = this.temp - this.tempMin,
            frac = relTemp / tempRange,
            angle = frac * 360,
            newHue = hueStart + (frac * hueRange);

        if (this.fc) {
            this.fc.clearRect(0, 0, this.fW, this.fH);
            this.fc.fillStyle = `hsla(${newHue},100%,50%,0.5)`;
            this.fc.globalAlpha = 0.25 + (0.75 * frac);

            let centerX = this.fW / 2,
                centerY = this.fH / 2;

            this.fizzParticles.forEach((p, i) => {
                let pd = p.minDist + frac * (p.maxDist - p.minDist),
                    pa = p.minRot + frac * (p.maxRot - p.minRot);

                p.x = centerX + pd * Math.sin(this.degToRad(pa));
                p.y = centerY + pd * Math.cos(this.degToRad(pa));

                this.fc!.beginPath();
                this.fc!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.fc!.fill();
                this.fc!.closePath();
            });
        }
        this.el.style.setProperty("--angle", angle.toString());
        this.el.style.setProperty("--hue", newHue.toString());

        if (tempDial && notDragged)
        tempDial.style.transform = `rotate(${angle}deg)`;
        if (tempDisplay)
        tempDisplay.textContent = Math.round(this.temp).toString() +`℃`;
        // 모든 처리가 완료된 후에 변경된 온도 값을 블루투스 장치로 전송
        //"send" dragend일때 출력
        if (inputVal === "send") {
          console.log(`{${this.identifier}:${this.temp}}`);
        } else {
          //console.error('No device connected');
        }
    }
  }
  }

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})

export class Tab2Page implements AfterViewInit {
  @ViewChildren('tempElement1, tempElement2, tempElement3') tempElements!: QueryList<ElementRef>;
  thermostatSimples: ThermostatSimple[] = [];
  //공유정보
  connectedDeviceId: string | null = null;
  selectedMacAddress: string | null = null;
  selectedImage: string | null = null;
  selectedId: string | null = null;
  //temperature
  public settingTemp: number = 0;  // 초기 온도 값으로 0 설정
  public currentTemp: number = 0;
  thermostatSimple?: ThermostatSimple;  // 옵셔널로 선언

  constructor(private cdRef: ChangeDetectorRef
  ) {}


  ngAfterViewInit() {
    this.tempElements.forEach((tempElementRef: ElementRef, index: number) => {
      const identifier = `Temp${index + 1}`;
      const thermostatSimpleInstance = new ThermostatSimple(tempElementRef.nativeElement, this, 0, 0, identifier);
      console.log(`DOM element for ${identifier}: `, tempElementRef.nativeElement); // DOM 요소 로깅
      this.thermostatSimples.push(thermostatSimpleInstance);
  
       // 여기에 Draggable을 생성하는 코드를 유지합니다.
    Draggable.create(tempElementRef.nativeElement.querySelector(".temp__dial"), {
      type: "rotation",
      bounds: {
        minRotation: 0,
        maxRotation: 359
      },
      onDrag: () => {
        thermostatSimpleInstance.tempAdjust("drag");
      },
      onDragEnd: () => {
        thermostatSimpleInstance.tempAdjust("send");
      }
    });
  });
  this.cdRef.detectChanges();
  }
}
