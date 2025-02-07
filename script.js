//@ts-check
"use strict";

/**
 * # Random number generator
 * `MurmurHash3` + `sfc32`
 * @author MAZ <https://MAZ01001.GitHub.io/>
 * @link <https://github.com/MAZ01001/Math-Js#rngjs>
 */
const RNG=class RNG{
    /**@type {number} - [Internal] bits  0-31  of 128bit RNG state*/_a_=0;
    /**@type {number} - [Internal] bits 32-63  of 128bit RNG state*/_b_=0;
    /**@type {number} - [Internal] bits 64-95  of 128bit RNG state*/_c_=0;
    /**@type {number} - [Internal] bits 96-127 of 128bit RNG state*/_d_=0;
    /**
     * ## [internal] Creates a 128bit hash from the given string
     * `MurmurHash3`
     * @param {string} str - any string (speed is linear related to length)
     * @returns {[number,number,number,number]} 128bit value in 32bit chunks (ordered `[0-31, 32-63, 64-95, 96-127]`)
     */
    static _hash_(str){
        const N=str.length;
        let h=0xAE69DB53|0;//~ 32bit seed (prime)
        for(let i=0;i<N;++i){
            const char=(k=>(k<<15)|(k>>17))(Math.imul(str.charCodeAt(i),0xCC9E2D51));
            h^=Math.imul(char,0x1B873593);
            h=(h<<13)|(h>>19);
            h=(Math.imul(h,5)+0xE6546B64)|0;
        }
        h^=N;
        const S=()=>{
            h^=h>>16;
            h=Math.imul(h,0x85EBCA6B);
            h^=h>>13;
            h=Math.imul(h,0xC2B2AE35);
            h^=h>>16;
            return h>>>0;
        };
        return[S(),S(),S(),S()];
    }
    /**
     * ## Create a new {@linkcode RNG} object
     * `sfc32`
     * @param {string} [seed] - [optional] a string used as the seed (via `MurmurHash3`) - defaults to current UTC milliseconds (in hex)
     * @example new RNG("seed").value; //=> 0.8370377509475307
     * @throws {TypeError} - if {@linkcode seed} is not a string (not when it is null/undefined)
     */
    constructor(seed){
        if(typeof (seed??=Date.now().toString(16))!=="string")throw new TypeError("[RNG:constructor] seed is not a string.");
        [this._a_,this._b_,this._c_,this._d_]=RNG._hash_(seed);
    }
    /**
     * ## Get the next random value
     * `sfc32`
     * @returns {number} 32bit unsigned integer
     */
    get val32(){
        const v=(((this._a_+this._b_)|0)+this._d_)|0;
        this._d_=(++this._d_)|0;
        this._a_=this._b_^(this._b_>>9);
        this._b_=(this._c_+(this._c_<<3))|0;
        this._c_=(this._c_<<21)|(this._c_>>11);
        this._c_=(this._c_+v)|0;
        return v>>>0;
    }
    static{//~ make class and prototype immutable
        Object.freeze(RNG.prototype);
        Object.freeze(RNG);
    }
};
/**Random number generator for dice rolls (init every page load)*/
const rng=new RNG();

/**@enum {number|Readonly<{max:number,step:number,faces:number}>}*/
const DiceType=Object.freeze({
    C:2,
    D4:4,
    D6:6,
    D8:8,
    D10:10,
    D12:12,
    D20:20,
    D100:Object.freeze({max:100,step:10,faces:10}),
});
/**@enum {(v:number,d:number)=>boolean}*/
const OperationType=Object.freeze({
    GE:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v>=d,
    LE:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v<=d,
    GT:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v>d,
    LT:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v<d,
    EQ:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v===d,
});

const html=Object.freeze({
    /**@type {HTMLDivElement}*/box:document.getElementById("box"),
    /**@type {HTMLDivElement}*/sheet:document.getElementById("sheet"),
    /**@type {HTMLInputElement}*/add:document.getElementById("add"),
    /**@type {HTMLInputElement}*/hover:document.getElementById("hover"),
    /**@type {HTMLInputElement}*/roll:document.getElementById("roll"),
    /**@type {HTMLSpanElement}*/chance:document.getElementById("chance"),
    /**@type {HTMLTemplateElement}*/dice:document.getElementById("dice"),
    /**@type {HTMLTemplateElement}*/throw:document.getElementById("throw"),
});
/**@type {Map<SVGElement,Dice>} maps any {@linkcode SVGElement} to their respective {@linkcode Dice} object*/
const diceLookup=new Map();

/**
 * ## Class for creating dice
 * uses {@linkcode DiceType}, {@linkcode rng}, {@linkcode html.hover}, {@linkcode html.dice}, and {@linkcode diceLookup} internally
 */
const Dice=class Dice{
    static _ANIM_TIME_=1000;
    static _ANIM_FLIP_=Object.freeze({rotate:["0turn 1 0 0","2turn 1 0 0"]});
    static _ANIM_TURN_=Object.freeze({rotate:["0turn 0 1 0","2turn 0 1 0"]});
    static _ANIM_ROLL_=Object.freeze({rotate:["0turn 0 0 1","2turn 0 0 1"]});
    static _ANIM_TEXT_=Object.freeze({opacity:[0,0,1],offset:[0,.7,1]});
    static _ANIM_DICE_CONF_=Object.freeze({id:"dice",duration:Dice._ANIM_TIME_,easing:"ease-out"});
    static _ANIM_TEXT_CONF_=Object.freeze({id:"dice",duration:Dice._ANIM_TIME_,easing:"linear"});
    static _TIMEOUT_DELAY_=Dice._ANIM_TIME_*.7;
    /**
     * ## [getter] Get dice roll animation duration
     * @returns {number} current animation duration in milliseconds
     */
    static get ANIM_TIME(){return Dice._ANIM_TIME_;}
    /**
     * ## [setter] Change dice roll animation duration
     * @param {number} ms - time in milliseconds for dice animation - default is `1000`
     * @throws {TypeError} if {@linkcode ms} is not a number
     * @throws {RangeError} if {@linkcode ms} is negative or `Infinity`
     */
    static set ANIM_TIME(ms){
        if(typeof ms!=="number")throw new TypeError("[Dice:ANIM_TIME:set] ms is not a number.");
        if(ms<0||ms===Infinity)throw new RangeError("[Dice:ANIM_TIME:set] ms can't be negative or Infinity.");
        Dice._ANIM_TIME_=ms;
        Dice._ANIM_DICE_CONF_=Object.freeze({id:"dice",duration:Dice._ANIM_TIME_,easing:"ease-out"});
        Dice._ANIM_TEXT_CONF_=Object.freeze({id:"dice",duration:Dice._ANIM_TIME_,easing:"linear"});
        Dice._TIMEOUT_DELAY_=Dice._ANIM_TIME_*.7;
        for(const[_,dice]of diceLookup){
            dice._useAnim_=dice._dice_.animate(dice.type===DiceType.C?Dice._ANIM_FLIP_:(dice.type===DiceType.D4||dice.type===DiceType.D10||dice.type===DiceType.D100)?Dice._ANIM_TURN_:Dice._ANIM_ROLL_,Dice._ANIM_DICE_CONF_);
            dice._textAnim_=dice._text_.animate(Dice._ANIM_TEXT_,Dice._ANIM_TEXT_CONF_);
            dice._useAnim_.finish();
            dice._textAnim_.finish();
        }
    }
    /**
     * ## Calculates a random number for the given {@linkcode diceType}
     * @param {DiceType} diceType - dice type to set random number range
     * @returns {number} random integer in {@linkcode diceType} range
     * @throws {TypeError} if {@linkcode diceType} is invalid (type/value)
     */
    static RNG(diceType){
        switch(diceType){
            case DiceType.C:return rng.val32<0x80000000?1:2;
            case DiceType.D4:return 1+Math.trunc(rng.val32/0x40000000);
            case DiceType.D6:return 1+Math.trunc(rng.val32*3/0x80000000);
            case DiceType.D8:return 1+Math.trunc(rng.val32/0x20000000);
            case DiceType.D10:return 1+Math.trunc(rng.val32*5/0x80000000);
            case DiceType.D12:return 1+Math.trunc(rng.val32*3/0x40000000);
            case DiceType.D20:return 1+Math.trunc(rng.val32*5/0x40000000);
            case DiceType.D100:return 10+10*Math.trunc(rng.val32*5/0x80000000);
        }
        if(typeof diceType==="number")return 1+Math.trunc(rng.val32*diceType/0x100000000);
        if(
            Number.isSafeInteger(diceType.faces)&&diceType.faces>0
            &&Number.isSafeInteger(diceType.step)&&diceType.step>0
        )return diceType.step+diceType.step*Math.trunc(rng.val32*diceType.faces/0x100000000);
        throw new TypeError("[Dice:RNG] diceType has invalid type or value.");
    }
    /**
     * ## [interanl] Event listener callback on {@linkcode Dice.prototype.html}
     * non-passive | can call {@linkcode Event.preventDefault}
     * @param {MouseEvent|KeyboardEvent} ev - `click`, `mouseenter`, or `keydown` event
     */
    _PointerHandler_(ev){
        if((ev instanceof KeyboardEvent)&&ev.key!==" "&&ev.key!=="Enter")return;
        ev.preventDefault();
        if((ev instanceof KeyboardEvent)&&ev.repeat)return;
        switch(html.hover.dataset.state){
            case"0":if(ev.type!=="mouseenter")this.Remove();break;
            case"1":if(ev.type!=="mouseenter")this.Roll();break;
            case"2":this.Roll();break;
        }
    }
    /**
     * ## [internal] Called from {@linkcode Dice.Roll} when animation finishes
     * puts the text on the dice and calls the {@linkcode callback} (given the constructor at init)
     */
    _Timeout_(){
        this._text_.textContent=String(this.num=Dice.RNG(this.type));
        this._CallbackRollEnd_();
    }
    /**
     * ## Create a new {@linkcode Dice} object
     * adds itself to {@linkcode diceLookup}
     * @param {DiceType} type - dice type
     * @param {HTMLElement} container - HTML container for this dice
     * @param {()=>void} CallbackRoll - called for every dice roll (start of the roll animation - might be called more often than {@linkcode CallbackRollEnd})
     * @param {()=>void} CallbackRollEnd - called after every dice roll (take number from {@linkcode Dice.num})
     * @param {(self:Dice)=>void} CallbackRemove - called when this dice is removed from DOM and it's safe to delete this object (given as the first parameter)
     * @throws {SyntaxError} when {@linkcode type} has invalid value
     */
    constructor(type,container,CallbackRoll,CallbackRollEnd,CallbackRemove){
        /**@type {DocumentFragment}*/const T=html.dice.content.cloneNode(true);
        /**@type {SVGSVGElement&HTMLElement}*/this.html=T.firstElementChild;
        /**@type {SVGUseElement}*/this._dice_=this.html.firstElementChild;
        /**@type {SVGTextElement}*/this._text_=this._dice_.nextElementSibling;
        /**@type {SVGTitleElement}*/this._title_=this._text_.nextElementSibling;
        container.append(T);
        switch(type){
            case DiceType.C:this._dice_.href.baseVal="#c";this._title_.textContent="C [Disc]";break;
            case DiceType.D4:this._dice_.href.baseVal="#d4";this._title_.textContent="D4 [Tetrahedron]";break;
            case DiceType.D6:this._dice_.href.baseVal="#d6";this._title_.textContent="D6 [Cube]";break;
            case DiceType.D8:this._dice_.href.baseVal="#d8";this._title_.textContent="D8 [Octahedron]";break;
            case DiceType.D10:this._dice_.href.baseVal="#d10";this._title_.textContent="D10 [Pentagonal trapezohedron]";break;
            case DiceType.D12:this._dice_.href.baseVal="#d12";this._title_.textContent="D12 [Dodecahedron]";break;
            case DiceType.D20:this._dice_.href.baseVal="#d20";this._title_.textContent="D20 [Icosahedron]";break;
            case DiceType.D100:this._dice_.href.baseVal="#d10";this._title_.textContent="D100 [Pentagonal trapezohedron]";break;
            default:throw new SyntaxError("[Dice:constructor] type has invalid value");
        }
        this._title_.textContent+=" click to remove/roll";
        this.html.addEventListener("click",ev=>this._PointerHandler_(ev),{passive:false});
        this.html.addEventListener("mouseenter",ev=>this._PointerHandler_(ev),{passive:false});
        this.html.addEventListener("keydown",ev=>this._PointerHandler_(ev),{passive:false});
        /**@type {DiceType} the type of dice*/this.type=type;
        /**@type {number|null} current number rolled (`null` initially and `NaN` during rolls)*/this.num=null;
        /**@type {()=>void}*/this._CallbackRoll_=CallbackRoll;
        /**@type {()=>void}*/this._CallbackRollEnd_=CallbackRollEnd;
        /**@type {(dice:Dice)=>void}*/this._CallbackRemove_=CallbackRemove;
        /**@type {number}*/this._timeoutID_=NaN;
        /**@type {Animation}*/this._useAnim_=this._dice_.animate(type===DiceType.C?Dice._ANIM_FLIP_:(type===DiceType.D4||type===DiceType.D10||type===DiceType.D100)?Dice._ANIM_TURN_:Dice._ANIM_ROLL_,Dice._ANIM_DICE_CONF_);
        /**@type {Animation}*/this._textAnim_=this._text_.animate(Dice._ANIM_TEXT_,Dice._ANIM_TEXT_CONF_);
        this._useAnim_.finish();
        this._textAnim_.finish();
        /**@type {boolean} [internal] `true` when {@linkcode Dice.Remove} was called once*/
        this._rem_=false;
        diceLookup.set(this.html,this);
    }
    /**
     * ## Generate Random number, animate dice roll, and display result
     * automatically cancels pending roll animations
     */
    Roll(){
        this._useAnim_.cancel();
        this._textAnim_.cancel();
        clearTimeout(this._timeoutID_);
        this.num=NaN;
        this._text_.textContent="";
        this._useAnim_.play();
        this._textAnim_.play();
        this._timeoutID_=setTimeout(()=>this._Timeout_(),Dice._TIMEOUT_DELAY_);
        this._CallbackRoll_();
    }
    /**
     * ## Remove all event listeners and {@linkcode Dice.html} from DOM
     * use before deleting obj; removes itself from {@linkcode diceLookup}\
     * also focuses next or previous html element (dice) if present
     */
    Remove(){
        if(this._rem_)return;
        this._rem_=true;
        this.html.removeEventListener("click",ev=>this._PointerHandler_(ev));
        this.html.removeEventListener("mouseenter",ev=>this._PointerHandler_(ev));
        this.html.removeEventListener("keydown",ev=>this._PointerHandler_(ev));
        if(this.html.nextElementSibling!=null)this.html.nextElementSibling.focus();
        else if(this.html.previousElementSibling!=null)this.html.previousElementSibling.focus();
        diceLookup.delete(this.html);
        this.html.remove();
        this._CallbackRemove_(this);
    }
};

/**
 * ## Class for creating probability tables
 * uses {@linkcode DiceType} internally
 */
const Probability=class Probability{
    /**## Create a new (empty) {@linkcode Probability} object*/
    constructor(){
        /**@type {readonly[number[],number[]]} [internal] probability table*/
        this._diceSums_=Object.freeze([[],[]]);
        /**@type {number} [internal] index of final probability row in {@linkcode Probability._diceSums_}*/
        this._diceSumIndex_=0;
        /**@type {number} [internal] sum of all values in final row of {@linkcode Probability._diceSums_}*/
        this._diceSumMax_=0;
    }
    /**
     * ## Populate internal probability table
     * @param {readonly DiceType[]} dice - list of dice (`number` => `{1, 2, ..., N}`; obj => `{1*STEP, 2*STEP, ..., MAX}`)
     */
    Setup(dice){
        if(dice.length>0){
            this._diceSums_[0][0]=1;
            this._diceSums_[0].length=1;
        }else this._diceSums_[0].length=0;
        /**@type {number}*/const diceMax=dice.reduce((o,v)=>o+(typeof v==="number"?v:v.max),0);
        for(let i=0,sum=NaN,face=NaN;i<dice.length;++i){
            const a=i&1,b=(i+1)&1;
            this._diceSums_[b].length=0;
            const d=dice[i];
            /**@type {number}*/const diceFaceMax=typeof d==="number"?d:d.max;
            /**@type {number}*/const diceFaceSteps=typeof d==="number"?1:d.step;
            for(sum=0;sum<=diceMax;++sum)
                for(face=diceFaceSteps;face<=diceFaceMax;face+=diceFaceSteps){
                    const faceSum=this._diceSums_[a][sum-face];
                    if(faceSum>0)this._diceSums_[b][sum]=(this._diceSums_[b][sum]??0)+faceSum;
                }
        }
        this._diceSums_[(dice.length+1)&1].length=0;
        this._diceSumIndex_=dice.length&1;
        this._diceSumMax_=this._diceSums_[this._diceSumIndex_].reduce((o,v)=>o+v,0);
    }
    /**
     * ## Check if any {@linkcode value} matches the {@linkcode comparison} for all possible dice throws
     * call {@linkcode Probability.Setup} first for specific dice setup
     * @param {number} value - number to check against all possible dice throws set with {@linkcode Probability.Setup}
     * @param {(value:number,diceSum:number)=>boolean} comparison - comparison function called with {@linkcode value} and a possible dice throw (sum of all dice rolled)
     * @returns {number} the percent (`[0,1]`) chance of the {@linkcode value} matching the {@linkcode comparison} for any given dice throw (or `NaN` when {@linkcode value} is `NaN` or there are no dice)
     */
    Check(value,comparison){
        if(Number.isNaN(value))return NaN;
        return this._diceSums_[this._diceSumIndex_].reduce((o,v,i)=>comparison(value,i)?o+v:o,0)/this._diceSumMax_;
    }
};

/**
 * ## Class for creating dice rolls
 * uses {@linkcode DiceType}, {@linkcode OperationType}, {@linkcode html.sheet}, {@linkcode html.hover}, {@linkcode html.throw}, {@linkcode Dice}, and {@linkcode Probability} internally
 */
const Roll=class Roll{
    /**
     * ## Maximum amount of dice per block
     * keep in range `[1..2^53[` (positive safe integer)\
     * max for {@linkcode Probability.Setup} is `floor((2^53-1)/MAX_DICE_VALUE)` (here `90071992547409` since `100` is currently highest dice value)
     */
    static MAX_DICE=48;
    /**
     * ## Maximum number of decimal places for {@linkcode Roll.FormatPercent}
     * only visual precision
     * keep in range `[0..20]` (positive integer <= 20)
     */
    static PRINT_PRECISION=5;
    /**
     * ## With and height of the resizer corner
     * used to set the size of {@linkcode Roll._diceContainer_} back to automatic
     */
    static RESIZER_SIZE=17;
    /**
     * ## Format percentage number to a string (including % sign)
     * @param {number} percent - `[0,1]` or `NaN`
     * @returns {string} `0%` to `100%` up to {@linkcode Roll.PRINT_PRECISION} decimal places (rounded) or `--%` when {@linkcode percent} is `NaN`
     */
    static FormatPercent(percent){return Number.isNaN(percent)?"--%":(percent*100).toFixed(Roll.PRINT_PRECISION).replace(/(\.\d*[1-9])0*$|\.0*$/,"$1")+"%";}
    /**## [internal] get numeric value from {@linkcode Roll._value_} or `NaN` if invalid*/
    get _valueNum_(){return this._value_.checkValidity()?Number(this._value_.value):NaN}
    /**
     * ## [internal] Set {@linkcode Roll._htmlStart_} and {@linkcode Roll._htmlHead_} `data-sum` to {@linkcode sum}
     * call with every dice change/roll
     * @param {number|null} sum - sum of all {@linkcode Roll.dice}, `NaN` for "--" (during rolls), and `null` for empty (one dice or less)
     */
    _UpdateSum_(sum){this._htmlHead_.dataset.sum=this._htmlStart_.dataset.sum=sum==null?"":Number.isNaN(sum)?"--":String(sum);}
    /**## [internal] Calculate success rate after dice roll and set {@linkcode Roll._diceContainer_} class*/
    _UpdateClass_(){
        this._diceContainer_.classList.remove("success","failure");
        this._UpdateSum_(this.dice.size>1?NaN:null);
        if(this.dice.size===0)return;
        let total=0;
        this.dice.forEach(v=>void(total+=v.num??NaN));
        if(Number.isNaN(total))return;
        this._UpdateSum_(this.dice.size>1?total:null);
        const num=this._valueNum_;
        if(Number.isNaN(num))return;
        this._diceContainer_.classList.add(OperationType[this._op_.value](num,total)?"success":"failure");
    }
    /**## [internal] Update {@linkcode Roll._diceContainer_} CSS `--width` & class and {@linkcode Roll.chance} via {@linkcode Probability.Check} (of {@linkcode Roll._probability_})*/
    _UpdateBlock_(){
        this._diceContainer_.style.setProperty("--width",String(Math.ceil(Math.sqrt(this.dice.size))));
        this._UpdateClass_();
        this.chance=this._probability_.Check(this._valueNum_,OperationType[this._op_.value]);
        this._chance_.textContent=Roll.FormatPercent(this.chance);
        this._CallbackChance_();
    }
    /**
     * ## [internal] Remove {@linkcode dice} from collection (and {@linkcode Roll._probability_}) and call {@linkcode Roll._UpdateBlock_}
     * re-enables {@linkcode Roll._add_} when below {@linkcode Roll.MAX_DICE}
     * @param {Dice} dice
     */
    _RemDice_(dice){
        this.dice.delete(dice);
        if(this.dice.size<Roll.MAX_DICE)this._add_.disabled=false;
        clearTimeout(this._timeoutProbability_);
        this._timeoutProbability_=setTimeout(()=>{
            const t=performance.now();
            this._probability_.Setup(Array.from(this.dice,v=>v.type).sort((a,b)=>(a.max??a)-(b.max??b)));
            console.log("%cProbability setup took %oms for %o dice.","color:#0a0;font-size:larger",Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)),this.dice.size);
            this._UpdateBlock_();
        },2);
    }
    /**
     * ## Create a new {@linkcode Roll} object
     * @param {()=>void} CallbackRoll - called every dice roll within this collection
     * @param {()=>void} CallbackRollEnd - called after every dice roll within this collection
     * @param {()=>void} CallbackChance - called after every change to {@linkcode Roll.chance}
     * @param {(self:Roll)=>void} CallbackRemove - called when this roll is removed from DOM and it's safe to delete this object (given as the first parameter)
     */
    constructor(CallbackRoll,CallbackRollEnd,CallbackChance,CallbackRemove){
        /**@type {DocumentFragment}*/const T=html.throw.content.cloneNode(true);
        /**@type {HTMLDivElement}*/this.html=T.firstElementChild;
        /**@type {HTMLDivElement}*/this._htmlStart_=T.querySelector("div.throw>div.start");
        /**@type {HTMLDivElement}*/this._htmlHead_=T.querySelector("div.throw>div.start>div.head");
        /**@type {HTMLSpanElement}*/this._name_=T.querySelector("div.throw>div.start>span");
        /**@type {HTMLInputElement}*/this._value_=T.querySelector("div.throw>div.start>div.head>input");
        /**@type {HTMLSelectElement}*/this._op_=T.querySelector("div.throw>div.start>div.head>select");
        /**@type {HTMLDivElement}*/this._diceContainer_=T.querySelector("div.throw>div.dice");
        /**@type {HTMLInputElement}*/this._add_=T.querySelector("div.throw>div.end>div.tail>input");
        /**@type {HTMLSelectElement}*/this._addSelect_=T.querySelector("div.throw>div.end>div.tail>select");
        /**@type {HTMLSpanElement}*/this._chance_=T.querySelector("div.throw>div.end>span");
        html.sheet.append(T);
        /**@type {()=>void}*/this._CallbackRoll_=CallbackRoll;
        /**@type {()=>void}*/this._CallbackRollEnd_=CallbackRollEnd;
        /**@type {()=>void}*/this._CallbackChance_=CallbackChance;
        /**@type {(self:Roll)=>void}*/this._CallbackRemove_=CallbackRemove;
        /**@type {number} percentage (`[0,1]`) chance for this dice roll*/
        this.chance=NaN;
        /**@type {Set<Dice>} collection of {@linkcode Dice} in this dice roll*/
        this.dice=new Set();
        /**@type {Probability} [internal] for calculating probability for this block*/
        this._probability_=new Probability();
        /**@type {number} [internal] timeout id to delay calls to {@linkcode Probability.Setup} (of {@linkcode Roll._probability_}) in {@linkcode Roll.AddDice} and {@linkcode Roll._RemDice_}*/
        this._timeoutProbability_=NaN;
        /**@type {CSSStyleDeclaration} [internal] live style declarations of {@linkcode Roll._diceContainer_}*/
        this._diceContainerStyle_=getComputedStyle(this._diceContainer_);
        this._name_.addEventListener("blur",()=>{
            if((this._name_.textContent=this._name_.textContent.trim())==="")this.Remove();
        },{passive:true});
        this._name_.addEventListener("keydown",ev=>{
            if(this._name_.textContent.length>=Number(this._name_.dataset.maxlength))ev.preventDefault();
            if(ev.key==="Enter"){
                ev.preventDefault();
                if(this._name_.textContent==="")this.Remove();
            }
        },{passive:false});
        this._value_.addEventListener("input",()=>this._UpdateBlock_(),{passive:true});
        this._value_.addEventListener("keydown",ev=>{
            if(ev.key!=="Enter"||ev.repeat)return;
            ev.preventDefault();
            this.RollAll();
        },{passive:false});
        this._op_.addEventListener("change",()=>this._UpdateBlock_(),{passive:true});
        this._add_.addEventListener("click",()=>this.AddDice(DiceType[this._addSelect_.value]),{passive:true});
        this.html.addEventListener("dblclick",ev=>{
            if(ev.target?.tagName!=="DIV")return;
            ev.preventDefault();
            if(ev.target!==this._diceContainer_){
                if(html.hover.dataset.state!=="0")this.RollAll();
                return;
            }
            const{right,bottom}=this._diceContainer_.getBoundingClientRect();
            const offsetRight=Math.trunc(right-Number.parseFloat(this._diceContainerStyle_.borderRightWidth)-ev.x);
            const offsetBottom=Math.trunc(bottom-Number.parseFloat(this._diceContainerStyle_.borderBottomWidth)-ev.y);
            if(offsetRight>=0&&offsetRight<=Roll.RESIZER_SIZE&&offsetBottom>=0&&offsetBottom<=Roll.RESIZER_SIZE){
                this._diceContainer_.style.removeProperty("width");
                this._diceContainer_.style.removeProperty("height");
            }else if(this.dice.size===0&&html.hover.dataset.state==="0")this.Remove();
            else if(html.hover.dataset.state!=="0")this.RollAll();
        },{passive:false});
        /**@type {boolean} [internal] `true` when {@linkcode Roll.Remove} was called once*/
        this._rem_=false;
    }
    /**
     * ## Add a new {@linkcode Dice} to collection/HTML (and internal probability table)
     * aborts before exceeding {@linkcode Roll.MAX_DICE} and disables the add-a-dice button when reaching it
     * @param {DiceType} type
     */
    AddDice(type){
        if(this.dice.size>=Roll.MAX_DICE)return;
        this.dice.add(new Dice(
            type,
            this._diceContainer_,
            ()=>{
                this._diceContainer_.classList.remove("success","failure");
                this._UpdateSum_(this.dice.size>1?NaN:null);
                this._CallbackRoll_();
            },
            ()=>{
                this._UpdateClass_();
                this._CallbackRollEnd_();
            },
            dice=>this._RemDice_(dice)
        ));
        if(this.dice.size>=Roll.MAX_DICE)this._add_.disabled=true;
        clearTimeout(this._timeoutProbability_);
        this._timeoutProbability_=setTimeout(()=>{
            const t=performance.now();
            this._probability_.Setup(Array.from(this.dice,v=>v.type).sort((a,b)=>(a.max??a)-(b.max??b)));
            console.log("%cProbability setup took %oms for %o dice.","color:#0a0;font-size:larger",Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)),this.dice.size);
            this._UpdateBlock_();
        },2);
    }
    /**## Rolls all dice within this collection*/
    RollAll(){this.dice.forEach(v=>v.Roll());}
    /**
     * ## Remove all event listeners, saved {@linkcode Dice}, and {@linkcode Roll.html} from DOM
     * use before deleting obj
     */
    Remove(){
        if(this._rem_)return;
        this._rem_=true;
        this._name_.removeEventListener("blur",()=>{
            if((this._name_.textContent=this._name_.textContent.trim())==="")this.Remove();
        });
        this._name_.removeEventListener("keydown",ev=>{
            if(this._name_.textContent.length>=Number(this._name_.dataset.maxlength))ev.preventDefault();
            if(ev.key==="Enter"){
                ev.preventDefault();
                if(this._name_.textContent==="")this.Remove();
            }
        });
        this._value_.removeEventListener("input",()=>this._UpdateBlock_());
        this._value_.removeEventListener("keydown",ev=>{
            if(ev.key!=="Enter"||ev.repeat)return;
            ev.preventDefault();
            this.RollAll();
        });
        this._op_.removeEventListener("change",()=>this._UpdateBlock_());
        this._add_.removeEventListener("click",()=>this.AddDice(DiceType[this._addSelect_.value]));
        this.html.removeEventListener("dblclick",ev=>{
            if(ev.target?.tagName!=="DIV")return;
            ev.preventDefault();
            if(ev.target!==this._diceContainer_){
                if(html.hover.dataset.state!=="0")this.RollAll();
                return;
            }
            const{right,bottom}=this._diceContainer_.getBoundingClientRect();
            const offsetRight=Math.trunc(right-Number.parseFloat(this._diceContainerStyle_.borderRightWidth)-ev.x);
            const offsetBottom=Math.trunc(bottom-Number.parseFloat(this._diceContainerStyle_.borderBottomWidth)-ev.y);
            if(offsetRight>=0&&offsetRight<=Roll.RESIZER_SIZE&&offsetBottom>=0&&offsetBottom<=Roll.RESIZER_SIZE){
                this._diceContainer_.style.removeProperty("width");
                this._diceContainer_.style.removeProperty("height");
            }else if(this.dice.size===0&&html.hover.dataset.state==="0")this.Remove();
            else if(html.hover.dataset.state!=="0")this.RollAll();
        });
        this.dice.forEach(v=>v.Remove());
        this.dice.clear();
        this.html.remove();
        this._CallbackRemove_(this);
    }
};

/**max number of {@linkcode rolls} allowed to exist at the same time*/
let MAX_ROLLS=100;

/**@type {Set<Roll>} collection of all {@linkcode Roll}s in {@linkcode html.sheet}*/
const rolls=new Set();

/**## Calculate if all rolls in total succeeded or failed*/
const CalcWin=()=>{
    html.box.classList.remove("success","failure");
    if(rolls.size===0)return;
    let f=false;
    for(const roll of rolls){
        if(roll._diceContainer_.classList.contains("failure"))f=true;
        else if(!roll._diceContainer_.classList.contains("success"))return;
    }
    html.box.classList.add(f?"failure":"success");
};
/**
 * ## Calculate total chance of all {@linkcode rolls} and display in {@linkcode html.chance}
 * also calls {@linkcode CalcWin}
 */
const CalcChance=()=>{
    CalcWin();
    if(rolls.size===0){
        html.chance.textContent=Roll.FormatPercent(NaN);
        return;
    }
    let p=1;
    rolls.forEach(v=>void(p*=v.chance));
    html.chance.textContent=Roll.FormatPercent(p);
};

html.sheet.addEventListener("touchmove",ev=>{
    if(ev.touches.length>1||html.hover.dataset.state!=="2")return;
    const{clientX,clientY,target}=ev.touches[0];
    if(!(target instanceof SVGElement))return;
    ev.preventDefault();
    for(const[el,dice]of diceLookup){
        const{top,bottom,left,right}=el.getBoundingClientRect();
        if(clientY<top||clientY>bottom||clientX<left||clientX>right)continue;
        if(!Number.isNaN(dice.num))dice.Roll();
        break;
    }
},{passive:false});
html.add.addEventListener("click",()=>{
    if(rolls.size>=MAX_ROLLS)return;
    rolls.add(new Roll(
        ()=>html.box.classList.remove("success","failure"),
        ()=>CalcWin(),
        ()=>CalcChance(),
        roll=>{
            rolls.delete(roll);
            CalcChance();
        }
    ));
    CalcChance();
},{passive:true});
html.hover.addEventListener("click",()=>{
    switch(html.hover.dataset.state){
        case"0":
            html.hover.dataset.state="1";
            html.hover.value="Click to rotate";
            break;
        case"1":
            html.hover.dataset.state="2";
            html.hover.value="Swipe to rotate";
            break;
        case"2":
            html.hover.dataset.state="0";
            html.hover.value="Click to remove";
            break;
    }
},{passive:true});
html.roll.addEventListener("click",()=>rolls.forEach(v=>v.RollAll()),{passive:true});

window.addEventListener("resize",()=>void html.box.classList.toggle("rows",window.innerWidth<window.innerHeight),{passive:true});
window.dispatchEvent(new UIEvent("resize"));

if(location.hash.length!==0){
    let[,d]=location.hash.match(/^#(c|d(?:[468]|1(?:2|00?)|20))$/i)??[];
    if(d!=null){
        d=d.toUpperCase();
        if(d in DiceType){
            html.add.click();
            /**@type {Roll}*/const r=rolls.values().next().value;
            r.AddDice(DiceType[d.toUpperCase()]);
            r.RollAll();
            r._value_.focus();
        }else html.add.focus();
    }else html.add.focus();
}else html.add.focus();
//~ remove search & hash from URL
history.replaceState(null,"",location.href.replace(/[?#].*$/,""));
