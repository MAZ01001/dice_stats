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

/**@enum {(v:number,d:number)=>boolean}*/
const OperationType=Object.freeze({
    GE:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v>=d,
    LE:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v<=d,
    GT:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v>d,
    LT:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v<d,
    EQ:/**@type {(v:number,d:number)=>boolean}*/(v,d)=>v===d,
});
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
/**
 * ## Get key for {@linkcode diceType} in {@linkcode DiceType}
 * @param {DiceType} diceType - value in {@linkcode DiceType}
 * @returns {keyof typeof DiceType|null} key in {@linkcode DiceType} that results in {@linkcode diceType} or `null` if no key matches
 */
const GetKeyOfDiceType=diceType=>{
    for(const key in DiceType)
        if(DiceType[key]===diceType)return key;
    return null;
};

const html=Object.freeze({
    /**@type {HTMLDivElement}*/box:document.getElementById("box"),
    /**@type {HTMLDivElement}*/sheet:document.getElementById("sheet"),
    /**@type {HTMLInputElement}*/add:document.getElementById("add"),
    /**@type {HTMLInputElement}*/hover:document.getElementById("hover"),
    /**@type {HTMLInputElement}*/permalink:document.getElementById("permalink"),
    /**@type {HTMLInputElement}*/roll:document.getElementById("roll"),
    /**@type {HTMLSpanElement}*/chance:document.getElementById("chance"),
    /**@type {HTMLDivElement}*/permalinkNote:document.getElementById("permalinkNote"),
    /**@type {HTMLTemplateElement}*/dice:document.getElementById("dice"),
    /**@type {HTMLTemplateElement}*/throw:document.getElementById("throw"),
});
/**@type {Map<SVGElement,Dice>} maps any {@linkcode SVGElement} to their respective {@linkcode Dice} object*/
const diceLookup=new Map();
/**Custom CSS for {@linkcode console} logging*/
const consoleLogCSS="color:#0a0;font-size:larger";

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
        this._timeoutID_=setTimeout(()=>{
            this._text_.textContent=String(this.num=Dice.RNG(this.type));
            this._CallbackRollEnd_();
        },Dice._TIMEOUT_DELAY_);
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
    /**@type {readonly[number[],number[]]} [internal] probability table*/
    _diceSums_=Object.freeze([[],[]]);
    /**@type {number} [internal] index of final probability row in {@linkcode Probability._diceSums_}*/
    _diceSumIndex_=0;
    /**@type {number} [internal] sum of all values in final row of {@linkcode Probability._diceSums_}*/
    _diceSumMax_=0;
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
    static{//~ make class and prototype immutable
        Object.freeze(Probability.prototype);
        Object.freeze(Probability);
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
            console.info("%cProbability setup took %oms for %o dice.",consoleLogCSS,Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)),this.dice.size);
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
            console.info("%cProbability setup took %oms for %o dice.",consoleLogCSS,Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)),this.dice.size);
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

/**
 * ## Class for managing all dice rolls
 * uses {@linkcode html.box}, {@linkcode html.chance}, and {@linkcode Roll} internally
 */
const Sheet=class Sheet{
    /**
     * ## Maximum amount of rolls/blocks
     * keep in range `[1..2^53[` (positive safe integer)
     */
    static MAX_ROLLS=100;
    /**@type {Set<Roll>} collection of all {@linkcode Roll}s in {@linkcode html.sheet}*/
    static rolls=new Set();
    /**[internal] Clear success/failure styling for {@linkcode html.box}*/
    static _ClearWin_(){html.box.classList.remove("success","failure");}
    /**[internal] Calculate if all rolls in total succeeded or failed*/
    static _CalcWin_(){
        Sheet._ClearWin_();
        if(Sheet.rolls.size===0)return;
        let f=false;
        for(const roll of Sheet.rolls){
            if(roll._diceContainer_.classList.contains("failure"))f=true;
            else if(!roll._diceContainer_.classList.contains("success"))return;
        }
        html.box.classList.add(f?"failure":"success");
    }
    /**
     * [internal] Calculate total chance of all {@linkcode Sheet.rolls} and display in {@linkcode html.chance}
     * also calls {@linkcode Sheet._CalcWin_}
     */
    static _CalcChance_(){
        Sheet._CalcWin_();
        if(Sheet.rolls.size===0){
            html.chance.textContent=Roll.FormatPercent(NaN);
            return;
        }
        let p=1;
        Sheet.rolls.forEach(v=>void(p*=v.chance));
        html.chance.textContent=Roll.FormatPercent(p);
    }
    /**
     * [internal] Removes a block from {@linkcode Sheet.rolls} and calls {@linkcode Sheet._CalcChance_}
     * @param {Roll} roll - element in {@linkcode Sheet.rolls}
     */
    static _RemoveRoll_(roll){
        Sheet.rolls.delete(roll);
        Sheet._CalcChance_();
    }
    /**
     * ## Creates a new dice roll block and adds it to {@linkcode Sheet.rolls}
     * @returns {Roll|null} the newly created {@linkcode Roll} object or `null` if {@linkcode Sheet.MAX_ROLLS} is reached
     */
    static CreateRoll(){
        if(Sheet.rolls.size>=Sheet.MAX_ROLLS)return null;
        const roll=new Roll(Sheet._ClearWin_,Sheet._CalcWin_,Sheet._CalcChance_,Sheet._RemoveRoll_);
        Sheet.rolls.add(roll);
        Sheet._CalcChance_();
        return roll;
    }
    /**## Rolls all dice on page*/
    static RollAll(){Sheet.rolls.forEach(v=>v.RollAll());}
    static{//~ make class and prototype immutable
        Object.freeze(Sheet.prototype);
        Object.freeze(Sheet);
    }
};

/**
 * ## Class for static regular expressions
 * not to be confused with {@linkcode RegExp}
 */
const REGEXP=class REGEXP{
    static _SETUP_FORMAT_=/(?!$)(?:"((?:\\.|""|[^\\"])*)")?(?:(?:(\d*)([><]=?|==?=?|[GL][ET]|EQ))?(\+?\d*(?:C+\+?\d*|(?:D\d+)+(?:\+\d*)?)*(?:C+|(?:D\d+)+))?|(\d+)((?:\+\d*)?(?:C+\+?\d*|(?:D\d+)+(?:\+\d*)?)*(?:C+|(?:D\d+)+))?)(?:,|$)/giy;
    /**regexp (match-all) for dice setup in formatted text (syntax/capture)*/
    static get SETUP_FORMAT(){
        REGEXP._SETUP_FORMAT_.lastIndex=0;
        return REGEXP._SETUP_FORMAT_;
    }
    static _SETUP_DICE_=/\+?(\d*)(C|D\d+)/giy;
    /**regexp (match-all) for dice list capture within/after {@linkcode REGEXP.SETUP_FORMAT}*/
    static get SETUP_DICE(){
        REGEXP._SETUP_DICE_.lastIndex=0;
        return REGEXP._SETUP_DICE_;
    }
    /**regexp (match-start) for {@linkcode BASE_URL} (case sensitive)*/
    static BASE_URL=/^https:\/\/maz01001\.github\.io\/dice_stats\/?#?/;
    static{//~ make class and prototype immutable
        Object.freeze(REGEXP.prototype);
        Object.freeze(REGEXP);
    }
};

/**Project base URL*/
const BASE_URL="https://maz01001.github.io/dice_stats/";

/**animation for {@linkcode html.permalinkNote}*/
const PERMALINK_NOTE_ANIMATION=html.permalinkNote.animate(
    {scale:["0","1","1","0"],bottom:["-2rem","0rem","0rem","-2rem"]},
    {duration:1000,easing:"cubic-bezier(0,.9,.9,0)"}
);
PERMALINK_NOTE_ANIMATION.finish();

/**
 * ## Create formatted text from current setup ({@linkcode REGEXP.SETUP_FORMAT})
 * @param {boolean} [autoRoll] - if `true` automatically rolls all dice when loading via {@linkcode LoadSetupText} - default `false`
 * @returns {string} current setup as formatted text
 */
const CreateSetupText=autoRoll=>{
    const t=performance.now();
    /**@type {string[]}*/let txt=[];
    for(const roll of Sheet.rolls){
        const name=roll._name_.textContent.replaceAll(/([\\"])/g,"\\$1");
        if(name!=="Name")txt.push(`"${name}"`);
        if(!Number.isNaN(roll._valueNum_))txt.push(roll._value_.value);
        if(roll._op_.value!=="GE")txt.push(roll._op_.value.toLowerCase());
        let lastType=null,
            counter=0;
        for(const{type}of roll.dice)
            if(lastType==null){
                lastType=type;
                ++counter;
            }else if(lastType===type)++counter;
            else{
                if(counter!==1)
                    if(/\d$/.test(txt[txt.length-1]))txt.push(`+${counter}`);
                    else txt.push(String(counter));
                else if(counter===1&&/\d$/.test(txt[txt.length-1]))txt.push("+");
                txt.push(GetKeyOfDiceType(lastType)?.toLowerCase()??"_");
                lastType=type;
                counter=1;
            }
        if(lastType!=null){
            if(counter!==1)
                if(/\d$/.test(txt[txt.length-1]))txt.push(`+${counter}`);
                else txt.push(String(counter));
            else if(counter===1&&/\d$/.test(txt[txt.length-1]))txt.push("+");
            txt.push(GetKeyOfDiceType(lastType)?.toLowerCase()??"_");
        }
        txt.push(",");
    }
    if(txt.length===0)return"";
    if(autoRoll??false)txt.push("roll");
    else if(txt[txt.length-2]!==",")txt.pop();
    const out=txt.join("");
    console.info("%cCreating setup text took %oms.",consoleLogCSS,Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)));
    return out;
};
/**
 * ## Load setup from formatted text ({@linkcode REGEXP.SETUP_FORMAT})
 * removes current setup first (even if {@linkcode txt} is empty)
 * @param {string} txt - formatted text (like from {@linkcode CreateSetupText})
 */
const LoadSetupText=txt=>{
    const t=performance.now();
    Sheet.rolls.forEach(v=>v.Remove());
    for(const[,name,valA,operator,diceListA,valB,diceListB]of txt.matchAll(REGEXP.SETUP_FORMAT)){
        const roll=Sheet.CreateRoll();
        if(roll==null)break;
        if(name!=null)roll._name_.textContent=name.replaceAll(/\\(.)/g,"$1").substring(0,Number(roll._name_.dataset.maxlength));
        roll._value_.value=valA??valB??"";
        if(operator!=null){
            const op=operator.toUpperCase();
            if(op in OperationType)roll._op_.value=op;
            else switch(op){
                case">=":roll._op_.value="GE";break;
                case"<=":roll._op_.value="LE";break;
                case">":roll._op_.value="GT";break;
                case"<":roll._op_.value="LT";break;
                case"=":case"==":case"===":roll._op_.value="EQ";break;
            }
        }
        for(let[,num,type]of (diceListA??diceListB??"").matchAll(REGEXP.SETUP_DICE)){
            if(roll.dice.size>=Roll.MAX_DICE)break;
            let amount=Math.min(Number(num===""?1:num),Roll.MAX_DICE-roll.dice.size);
            if(amount===0)continue;
            if(!((type=type.toUpperCase())in DiceType))continue;
            for(let i=0;i<amount;++i)roll.AddDice(DiceType[type]);
        }
        if(roll.dice.size===0)roll._UpdateBlock_();
    }
    if(txt.substring(txt.length-5).toLowerCase()===",roll")html.roll.click();
    console.info("%cLoading setup text took %oms.",consoleLogCSS,Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)));
};
/**
 * ## Creates permalink and copies it to clipboard
 * @returns {URL} the newly created permalink
 */
const CopyPermalink=()=>{
    PERMALINK_NOTE_ANIMATION.cancel();
    const permalink=new URL(BASE_URL);
    permalink.hash=CreateSetupText(false);
    console.info("%cPermalink: %s",consoleLogCSS,permalink.href);
    if(typeof navigator.clipboard==="undefined"){
        html.permalinkNote.textContent="Clipboard is not available";
        html.permalinkNote.dataset.state="f";
        PERMALINK_NOTE_ANIMATION.play();
    }else navigator.clipboard.writeText(permalink.href).then(
        ()=>{
            console.debug("%cPermalink successfully copied to clipboard.",consoleLogCSS);
            html.permalinkNote.textContent="Permalink copied to clipboard";
            html.permalinkNote.dataset.state="";
            PERMALINK_NOTE_ANIMATION.play();
        },
        err=>{
            console.error("%cCouldn't copy permalink to clipboard: %o",consoleLogCSS,err);
            html.permalinkNote.textContent="Could not copy to clipboard";
            html.permalinkNote.dataset.state="f";
            PERMALINK_NOTE_ANIMATION.play();
        }
    );
    return permalink;
};
/**
 * [internal] Decode hash (#) from given URL
 * tries parsing {@linkcode href} to URL and returns empty string if it fails
 * @param {string|URL} href - encoded URL
 * @returns {string} decoded string (not including #)
 */
const _GetHashOfURL_=href=>{
    const url=(()=>{
        try{
            if(href instanceof URL)return decodeURI(href.href);
            const parse=URL.parse(href)?.href;
            return parse==null?href:decodeURI(parse);
        }catch(err){
            if(err instanceof URIError)
                if(href instanceof URL)return href.href;
                else return URL.parse(href)?.href??href;
            throw err;
        }
    })();
    const hashIndex=url.indexOf("#");
    if(hashIndex===-1)return"";
    return url.substring(hashIndex+1);
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
html.add.addEventListener("click",()=>void Sheet.CreateRoll(),{passive:true});
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
html.permalink.addEventListener("click",()=>void CopyPermalink(),{passive:true});
html.roll.addEventListener("click",Sheet.RollAll,{passive:true});

window.addEventListener("resize",()=>void html.box.classList.toggle("rows",window.innerWidth<window.innerHeight),{passive:true});
window.dispatchEvent(new UIEvent("resize"));

window.addEventListener("cut",ev=>{
    if(ev.target instanceof HTMLInputElement&&ev.target.type==="number"||String(document.getSelection()??"").length!==0)return;
    ev.preventDefault();
    CopyPermalink();
    Sheet.rolls.forEach(v=>v.Remove());
},{passive:false});
window.addEventListener("copy",ev=>{
    if(ev.target instanceof HTMLInputElement&&ev.target.type==="number"||String(document.getSelection()??"").length!==0)return;
    ev.preventDefault();
    CopyPermalink();
},{passive:false});
window.addEventListener("paste",ev=>{
    const clipCode=ev.clipboardData?.getData("text/plain")??"";
    if(clipCode.length===0||ev.target instanceof HTMLInputElement&&ev.target.type==="number")return;
    ev.preventDefault();
    if(REGEXP.SETUP_FORMAT.test(clipCode))return LoadSetupText(clipCode);
    if(!clipCode.startsWith("#")&&!REGEXP.BASE_URL.test(clipCode))return;
    const clipHash=_GetHashOfURL_(clipCode);
    if(clipHash.length!==0)LoadSetupText(clipHash);
},{passive:false});

window.addEventListener("hashchange",ev=>{
    const hash=_GetHashOfURL_(ev.newURL);
    if(hash.length===0)return;
    ev.preventDefault();
    LoadSetupText(hash);
},{passive:false});

//~ load from URL hash (#) if valid
(()=>{
    const hash=_GetHashOfURL_(location.href);
    if(hash.length===0)return html.add.focus();
    LoadSetupText(hash);
    html.roll.focus();
})();
