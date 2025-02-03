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

/**@enum {number}*/
const DiceType=Object.freeze({
    C:2,
    D4:4,
    D6:6,
    D8:8,
    D10:10,
    D12:12,
    D20:20,
    D100:100,
});
/**@enum {string}*/
const OperationType=Object.freeze({
    GE:"ge",
    LE:"le",
    GT:"gt",
    LT:"lt",
    EQ:"eq",
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

/**
 * ## Class for creating dice
 * uses {@linkcode DiceType}, {@linkcode rng}, {@linkcode html.hover}, and {@linkcode html.dice} internally
 */
const Dice=class Dice{
    static ANIM_TIME=1000;
    static ANIM_FLIP=Object.freeze({rotate:["0turn 1 0 0","2turn 1 0 0"]});
    static ANIM_TURN=Object.freeze({rotate:["0turn 0 1 0","2turn 0 1 0"]});
    static ANIM_ROLL=Object.freeze({rotate:["0turn 0 0 1","2turn 0 0 1"]});
    static ANIM_TEXT=Object.freeze({opacity:[0,0,1],offset:[0,.7,1]});
    static ANIM_DICE_CONF=Object.freeze({id:"dice",duration:Dice.ANIM_TIME,easing:"ease-out"});
    static ANIM_TEXT_CONF=Object.freeze({id:"dice",duration:Dice.ANIM_TIME,easing:"linear"});
    static TIMEOUT_DELAY=Dice.ANIM_TIME*.7;
    //~ [1..max] ← 1 + floor(rng32bit * max / 2^32)
    static get[DiceType.C](){return rng.val32<0x80000000?1:2;}
    static get[DiceType.D4](){return 1+Math.trunc(rng.val32/0x40000000);}
    static get[DiceType.D6](){return 1+Math.trunc(rng.val32*3/0x80000000);}
    static get[DiceType.D8](){return 1+Math.trunc(rng.val32/0x20000000);}
    static get[DiceType.D10](){return 1+Math.trunc(rng.val32*5/0x80000000);}
    static get[DiceType.D12](){return 1+Math.trunc(rng.val32*3/0x40000000);}
    static get[DiceType.D20](){return 1+Math.trunc(rng.val32*5/0x40000000);}
    static get[DiceType.D100](){return 10+10*Math.trunc(rng.val32*5/0x80000000);}
    /**
     * ## [interanl] Event listener callback on {@linkcode Dice.prototype.html}
     * non-passive | can call {@linkcode Event.preventDefault}
     * @param {MouseEvent|KeyboardEvent} ev - `click`, `mouseenter`, or `keydown` event
     */
    _PointerHandler_(ev){
        if((ev instanceof KeyboardEvent)&&ev.key!==" "&&ev.key!=="Enter")return;
        ev.preventDefault();
        if((ev instanceof KeyboardEvent)&&ev.repeat)return;
        if(html.hover.dataset.toggle==="1")this.Roll();
        else if(ev.type!=="mouseenter")this.Remove();
    }
    /**
     * ## [internal] Called from {@linkcode Dice.Roll} when animation finishes
     * puts the text on the dice and calls the {@linkcode callback} (given the constructor at init)
     */
    _Timeout_(){
        this._text_.textContent=String(this.num=Dice[this.type]);
        this._CallbackRollEnd_();
    }
    /**
     * ## Create a new {@linkcode Dice} object
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
        /**@type {number} current number rolled (`NaN` initially and during rolls)*/this.num=NaN;
        /**@type {()=>void}*/this._CallbackRoll_=CallbackRoll;
        /**@type {()=>void}*/this._CallbackRollEnd_=CallbackRollEnd;
        /**@type {(dice:Dice)=>void}*/this._CallbackRemove_=CallbackRemove;
        /**@type {number}*/this._timeoutID_=NaN;
        /**@type {Animation}*/this._useAnim_=this._dice_.animate(type===DiceType.C?Dice.ANIM_FLIP:(type===DiceType.D4||type===DiceType.D10||type===DiceType.D100)?Dice.ANIM_TURN:Dice.ANIM_ROLL,Dice.ANIM_DICE_CONF);
        /**@type {Animation}*/this._textAnim_=this._text_.animate(Dice.ANIM_TEXT,Dice.ANIM_TEXT_CONF);
        this._useAnim_.finish();
        this._textAnim_.finish();
        /**@type {boolean} [internal] `true` when {@linkcode Dice.Remove} was called once*/
        this._rem_=false;
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
        this._timeoutID_=setTimeout(()=>this._Timeout_(),Dice.TIMEOUT_DELAY);
        this._CallbackRoll_();
    }
    /**
     * ## Remove all event listeners and {@linkcode Dice.html} from DOM
     * use before deleting obj
     */
    Remove(){
        if(this._rem_)return;
        this._rem_=true;
        this.html.removeEventListener("click",ev=>this._PointerHandler_(ev));
        this.html.removeEventListener("mouseenter",ev=>this._PointerHandler_(ev));
        this.html.removeEventListener("keydown",ev=>this._PointerHandler_(ev));
        this.html.remove();
        this._CallbackRemove_(this);
    }
};

/**
 * ## Class for creating dice rolls
 * uses {@linkcode DiceType}, {@linkcode OperationType}, {@linkcode html.sheet}, {@linkcode html.hover}, {@linkcode html.throw}, and {@linkcode Dice} internally
 */
const Roll=class Roll{
    /**
     * ## Maximum amount of dice per block
     * limited by reasonable compute time of {@linkcode Roll.Probability}
     * keep in range `[1..2^53[` (positive safe integer)
     */
    static MAX_DICE=5;
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
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.GE](a,b){return a>=b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.LE](a,b){return a<=b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.GT](a,b){return a>b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.LT](a,b){return a<b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.EQ](a,b){return a===b;}
    /**
     * ## Calculate probability of a {@linkcode dice} throw in relation to {@linkcode value} and {@linkcode operation}
     * as in `value <operation> dice_0 + dice_1 + ... + dice_n`\
     * WARNING more than 5 {@linkcode dice} take a very noticeable amount of time ! as it increases exponentially with dice amount and multiplicative with face count of those dice\
     * for example 5 d20 = 20*20*20*20*20 = 3'200'000 comparisons
     * @param {number} value - number for comparing to the sum of all {@linkcode dice} in terms of probability to meet the condition with the given {@linkcode operation}
     * @param {OperationType} operation - comparison operator for {@linkcode value} ({@linkcode OperationType})
     * @param {readonly DiceType[]} dice - list of {@linkcode DiceType} (also supports dice with `[1..2^53[` (positive safe integer) max faces)
     * @returns {number} percentage `[0,1]` or `NaN` if {@linkcode value} is `NaN` or {@linkcode dice} is empty or has non-supported dice
     */
    static Probability(value,operation,dice){
        if(dice.length==0||Number.isNaN(value))return NaN;
        let diceMin=0,
            diceMax=0;
        for(const d of dice){
            //~ early exit if not a (supported) dice
            if(!Number.isSafeInteger(d)||d<1)return NaN;
            diceMin+=d===DiceType.D100?10:1;
            diceMax+=d;
        }
        //~ early exit if out of range (for specific operation) or single dice
        switch(operation){
            case OperationType.GE:
                if(value<diceMin)return 0;
                if(value>=diceMax)return 1;
                if(dice.length===1)return dice[0]===DiceType.D100?Math.trunc(value/10)/10:value/dice[0];
                break;
            case OperationType.LE:
                if(value>diceMax)return 0;
                if(value<=diceMin)return 1;
                if(dice.length===1)return dice[0]===DiceType.D100?(10-Math.trunc((value-1)/10))/10:(dice[0]-(value-1))/dice[0];
                break;
            case OperationType.GT:
                if(value<=diceMin)return 0;
                if(value>diceMax)return 1;
                if(dice.length===1)return dice[0]===DiceType.D100?Math.trunc((value-1)/10)/10:(value-1)/dice[0];
                break;
            case OperationType.LT:
                if(value>=diceMax)return 0;
                if(value<diceMin)return 1;
                if(dice.length===1)return dice[0]===DiceType.D100?(10-Math.trunc(value/10))/10:(dice[0]-value)/dice[0];
                break;
            case OperationType.EQ:
                if(value<diceMin||value>diceMax)return 0;
                if(dice.length===1)return dice[0]===DiceType.D100?(value%10===0?.1:0):1/dice[0];
                break;
            default:return NaN;
        }
        /**@type {number[]} index/face (-1) of each {@linkcode dice} with same index (except {@linkcode DiceType.D100} is `[0..9]` like {@linkcode DiceType.D10} not `{0,10,20,...,90}`)*/
        const M=new Array(dice.length).fill(0);
        let match=0,all=0;
        //? number_of_iterations => dice.reduce((o,v)=>o*BigInt(v===DiceType.D100?10:v),1n)
        do{
            if(Roll[operation](value,M.reduce((o,v,i)=>o+(dice[i]===DiceType.D100?v*10+10:v+1),0)))++match;
            ++all;
            for(let i=0;i<M.length;++i){
                if(++M[i]<(dice[i]===DiceType.D100?10:dice[i]))break;
                M[i]=0;
            }
        }while(M.some(v=>v!==0));
        return match/all;
    }
    /**
     * ## Format percentage number to a string (including % sign)
     * padding with non-breaking-space (`0xa0`) so it's centered around the one's digit
     * @param {number} percent - `[0,1]` or `NaN`
     * @returns {string} ` 0%` to `100%` up to {@linkcode Roll.PRINT_PRECISION} decimal places (rounded) or `--%` when {@linkcode percent} is `NaN`
     */
    static FormatPercent(percent){
        if(typeof percent!=="number"||Number.isNaN(percent))return"--%";
        const n=(percent*100).toFixed(Roll.PRINT_PRECISION).replace(/(\.\d*[1-9])0*$|\.0*$/,"$1")+"%";
        const[,l,r]=n.match(/^(\d*)\d((?:[\.e].+?)?%)$/);
        if(l.length<=r.length)return"\xa0".repeat(r.length-l.length)+n;
        return n+"\xa0".repeat(l.length-r.length);
    }
    /**## [internal] get numeric value from {@linkcode Roll._value_} or `NaN` if invalid*/
    get _valueNum_(){return this._value_.checkValidity()?Number(this._value_.value):NaN}
    /**## [internal] Calculate success rate after dice roll and set {@linkcode Roll._diceContainer_} class*/
    _UpdateClass_(){
        this._diceContainer_.classList.remove("success","failure");
        if(this._dice_.size===0)return;
        const num=this._valueNum_;
        if(Number.isNaN(num))return;
        let total=0;
        this._dice_.forEach(v=>void(total+=v.num));
        if(Number.isNaN(total))return;
        this._diceContainer_.classList.add(Roll[this._op_.value](num,total)?"success":"failure");
    }
    /**## [internal] Update {@linkcode Roll._diceContainer_} CSS `--width` & class and {@linkcode Roll.chance} via {@linkcode Roll.Probability}*/
    _UpdateRow_(){
        this._diceContainer_.style.setProperty("--width",String(Math.ceil(Math.sqrt(this._dice_.size))));
        this._UpdateClass_();
        clearTimeout(this._timeoutProbability_);
        this._timeoutProbability_=setTimeout(()=>{
            /**@type {DiceType[]}*/const dice=Array.from(this._dice_,v=>v.type);
            const t=performance.now();
            this.chance=Roll.Probability(this._valueNum_,this._op_.value,dice);
            console.log("%cProbability calculation took %oms for %o dice.","color:#0a0;font-size:larger",Number((performance.now()-t).toFixed(Roll.PRINT_PRECISION)),dice);
            this._chance_.textContent=Roll.FormatPercent(this.chance);
            this._CallbackChance_();
        },2);
    }
    /**
     * ## [internal] Remove {@linkcode dice} from collection and call {@linkcode Roll._UpdateRow_}
     * re-enables {@linkcode Roll._add_} when below {@linkcode Roll.MAX_DICE}
     * @param {Dice} dice
     */
    _RemDice_(dice){
        this._dice_.delete(dice);
        this._UpdateRow_();
        if(this._dice_.size<Roll.MAX_DICE)this._add_.disabled=false;
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
        /**@type {Set<Dice>} [internal] collection of {@linkcode Dice} in {@linkcode Roll._diceContainer_}*/
        this._dice_=new Set();
        /**@type {number} [internal] timeout id to delay call to {@linkcode Roll.Probability} in {@linkcode Roll._UpdateRow_}*/
        this._timeoutProbability_=NaN;
        /**@type {CSSStyleDeclaration} [internal] live style declarations of {@linkcode Roll._diceContainer_}*/
        this._diceContainerStyle_=getComputedStyle(this._diceContainer_);
        this._name_.addEventListener("blur",()=>{
            if((this._name_.textContent=this._name_.textContent.trim())==="")this.Remove();
        },{passive:true});
        this._name_.addEventListener("keydown",ev=>{
            this._name_.textContent=this._name_.textContent.trim();
            if(ev.key==="Enter"){
                ev.preventDefault();
                if(this._name_.textContent==="")this.Remove();
            }
        },{passive:false});
        this._value_.addEventListener("input",()=>this._UpdateRow_(),{passive:true});
        this._value_.addEventListener("keydown",ev=>{
            if(ev.key!=="Enter"||ev.repeat)return;
            ev.preventDefault();
            this.RollAll();
        },{passive:false});
        this._op_.addEventListener("change",()=>this._UpdateRow_(),{passive:true});
        this._add_.addEventListener("click",()=>this.AddDice(Number(this._addSelect_.value)),{passive:true});
        this._diceContainer_.addEventListener("dblclick",ev=>{
            if(ev.target!==this._diceContainer_)return;
            ev.preventDefault();
            const{right,bottom}=this._diceContainer_.getBoundingClientRect();
            const offsetRight=Math.trunc(right-Number.parseFloat(this._diceContainerStyle_.borderRightWidth)-ev.x);
            const offsetBottom=Math.trunc(bottom-Number.parseFloat(this._diceContainerStyle_.borderBottomWidth)-ev.y);
            if(offsetRight>=0&&offsetRight<=Roll.RESIZER_SIZE&&offsetBottom>=0&&offsetBottom<=Roll.RESIZER_SIZE){
                this._diceContainer_.style.removeProperty("width");
                this._diceContainer_.style.removeProperty("height");
            }else if(this._dice_.size===0&&html.hover.dataset.toggle==="0")this.Remove();
            else if(html.hover.dataset.toggle!=="0")this.RollAll();
        },{passive:false});
        /**@type {boolean} [internal] `true` when {@linkcode Roll.Remove} was called once*/
        this._rem_=false;
    }
    /**
     * ## Add a new {@linkcode Dice} to collection/HTML
     * aborts before exceeding {@linkcode Roll.MAX_DICE} and disables the add-a-dice button when reaching it
     * @param {DiceType} type
     */
    AddDice(type){
        if(this._dice_.size>=Roll.MAX_DICE)return;
        this._dice_.add(new Dice(type,this._diceContainer_,()=>{this._diceContainer_.classList.remove("success","failure");this._CallbackRoll_();},()=>{this._UpdateClass_();this._CallbackRollEnd_();},dice=>this._RemDice_(dice)));
        this._UpdateRow_();
        if(this._dice_.size>=Roll.MAX_DICE)this._add_.disabled=true;
    }
    /**## Rolls all dice within this collection*/
    RollAll(){this._dice_.forEach(v=>v.Roll());}
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
            this._name_.textContent=this._name_.textContent.trim();
            if(ev.key==="Enter"){
                ev.preventDefault();
                if(this._name_.textContent==="")this.Remove();
            }
        });
        this._value_.removeEventListener("input",()=>this._UpdateRow_());
        this._value_.removeEventListener("keydown",ev=>{
            if(ev.key!=="Enter"||ev.repeat)return;
            ev.preventDefault();
            this.RollAll();
        });
        this._op_.removeEventListener("change",()=>this._UpdateRow_());
        this._add_.removeEventListener("click",()=>this.AddDice(Number(this._addSelect_.value)));
        this._diceContainer_.removeEventListener("dblclick",ev=>{
            if(ev.target!==this._diceContainer_)return;
            ev.preventDefault();
            const{right,bottom}=this._diceContainer_.getBoundingClientRect();
            const offsetRight=Math.trunc(right-Number.parseFloat(this._diceContainerStyle_.borderRightWidth)-ev.x);
            const offsetBottom=Math.trunc(bottom-Number.parseFloat(this._diceContainerStyle_.borderBottomWidth)-ev.y);
            if(offsetRight>=0&&offsetRight<=Roll.RESIZER_SIZE&&offsetBottom>=0&&offsetBottom<=Roll.RESIZER_SIZE){
                this._diceContainer_.style.removeProperty("width");
                this._diceContainer_.style.removeProperty("height");
            }else if(this._dice_.size===0&&html.hover.dataset.toggle==="0")this.Remove();
            else if(html.hover.dataset.toggle!=="0")this.RollAll();
        });
        this._dice_.forEach(v=>v.Remove());
        this.html.remove();
        this._CallbackRemove_(this);
    }
};

/**max number of {@linkcode rolls} allowed to exist at the same time*/
const MAX_ROLLS=100;

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

html.add.addEventListener("click",()=>{
    if(rolls.size>=MAX_ROLLS)return;
    rolls.add(new Roll(()=>html.box.classList.remove("success","failure"),()=>CalcWin(),()=>CalcChance(),roll=>{rolls.delete(roll);CalcChance();}));
    CalcChance();
},{passive:true});
html.hover.addEventListener("click",()=>{
    if(html.hover.dataset.toggle==="0"){
        html.hover.dataset.toggle="1";
        html.hover.value="Point to rotate";
    }else{
        html.hover.dataset.toggle="0";
        html.hover.value="Click to remove";
    }
},{passive:true});
html.roll.addEventListener("click",()=>rolls.forEach(v=>v.RollAll()),{passive:true});

window.addEventListener("resize",()=>void html.box.classList.toggle("rows",window.innerWidth<window.innerHeight),{passive:true});
window.dispatchEvent(new UIEvent("resize"));

if(location.hash.length!==0){
    const[,d]=location.hash.match(/^#(c|d(?:[468]|1(?:2|00?)|20))$/i)??[];
    if(d!=null){
        html.add.click();
        /**@type {Roll}*/const r=rolls.values().next().value;
        r.AddDice(DiceType[d.toUpperCase()]);
        r.RollAll();
        r._value_.focus();
    }
}else html.add.focus();
//~ remove search & hash from URL
history.replaceState(null,"",location.href.replace(/[?#].*$/,""));
