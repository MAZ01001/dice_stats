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
    /**@type {HTMLTemplateElement}*/row:document.getElementById("row"),
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
        this.num=Dice[this.type];
        this._text_.textContent=String(this.num);
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
        /**@type {number} current number rolled (initially `NaN`)*/this.num=NaN;
        /**@type {()=>void}*/this._CallbackRoll_=CallbackRoll;
        /**@type {()=>void}*/this._CallbackRollEnd_=CallbackRollEnd;
        /**@type {(dice:Dice)=>void}*/this._CallbackRemove_=CallbackRemove;
        /**@type {number}*/this._timeoutID_=NaN;
        /**@type {Animation}*/this._useAnim_=this._dice_.animate(type===DiceType.C?Dice.ANIM_FLIP:(type===DiceType.D4||type===DiceType.D10||type===DiceType.D100)?Dice.ANIM_TURN:Dice.ANIM_ROLL,Dice.ANIM_DICE_CONF);
        /**@type {Animation}*/this._textAnim_=this._text_.animate(Dice.ANIM_TEXT,Dice.ANIM_TEXT_CONF);
        this._useAnim_.finish();
        this._textAnim_.finish();
    }
    /**
     * ## Generate Random number, animate dice roll, and display result
     * automatically cancels pending roll animations
     */
    Roll(){
        this._useAnim_.cancel();
        this._textAnim_.cancel();
        clearTimeout(this._timeoutID_);
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
        this.html.removeEventListener("click",ev=>this._PointerHandler_(ev));
        this.html.removeEventListener("mouseenter",ev=>this._PointerHandler_(ev));
        this.html.removeEventListener("keydown",ev=>this._PointerHandler_(ev));
        this.html.remove();
        this._CallbackRemove_(this);
    }
};

/**
 * ## Class for creating rolls (rows)
 * uses {@linkcode DiceType}, {@linkcode OperationType}, {@linkcode html.sheet}, {@linkcode html.row}, and {@linkcode Dice} internally
 */
const Roll=class Roll{
    // TODO add more dice ~ see Roll:Probability
    static MAX_DICE=1;
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.GE](a,b){return a>=b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.LE](a,b){return a<=b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.GT](a,b){return a>b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.LT](a,b){return a<b;}
    /**@type {(a:number,b:number)=>boolean}*/static[OperationType.EQ](a,b){return a===b;}
    /**
     * ## Calculate probability of a {@linkcode dice} throw in relation to {@linkcode value} and {@linkcode operation}
     * currently only supports 1 {@linkcode dice}
     * @param {number} value
     * @param {OperationType} operation
     * @param {DiceType[]} dice
     * @returns {number} percentage `[0,1]` or `NaN` if {@linkcode value} is `NaN` or {@linkcode dice} holds no dice
     * @throws {SyntaxError} when {@linkcode operation} has invalid value
     * @throws {RangeError} when {@linkcode dice} has too many elements
     */
    static Probability(value,operation,dice){
        if(dice.length==0||Number.isNaN(value))return NaN;
        if(dice.length===1)switch(operation){
            case OperationType.GE:return dice[0]===DiceType.D100?(value<10?0:value>=100?1:Math.trunc(value/10)/10):(value<1?0:value>=dice[0]?1:value/dice[0]);
            case OperationType.LE:return dice[0]===DiceType.D100?(value<=10?1:value>100?0:(10-Math.trunc((value-1)/10))/10):(value<=1?1:value>dice[0]?0:(dice[0]-(value-1))/dice[0]);
            case OperationType.GT:return dice[0]===DiceType.D100?(value<=10?0:value>100?1:Math.trunc((value-1)/10)/10):(value<=1?0:value>dice[0]?1:(value-1)/dice[0]);
            case OperationType.LT:return dice[0]===DiceType.D100?(value<10?1:value>=100?0:(10-Math.trunc(value/10))/10):(value<1?1:value>=dice[0]?0:(dice[0]-value)/dice[0]);
            case OperationType.EQ:return dice[0]===DiceType.D100?(value<10||value>100?0:value%10===0?.1:0):(value<1||value>dice[0]?0:1/dice[0]);
            default:throw new SyntaxError("[Roll:Probability] operation has invalid value");
        }
        // TODO add more dice (calculate probability of multiple different dice)
        throw new RangeError("[Roll:Probability] can't calculate probability of more than one dice");
    }
    /**
     * ## Format percentage number to a string (including % sign)
     * @param {number} percent - `[0,1]` or `NaN`
     * @returns {string} `0%` to `100%` up to 3 decimal places (rounded) or `--%` when {@linkcode percent} is `NaN`
     */
    static FormatPercent(percent){return typeof percent!=="number"||Number.isNaN(percent)?"--%":((percent*100).toFixed(3).replace(/(\.\d*[1-9])0*$|\.0*$/,"$1")+"%");}
    /**## [internal] get numeric value from {@linkcode Roll._value_} or `NaN` if invalid*/
    get _valueNum_(){return this._value_.checkValidity()?Number(this._value_.value):NaN}
    /**## [internal] Calculate success rate after dice roll and set {@linkcode Roll._diceContainer_} class*/
    _UpdateClass_(){
        if(this._dice_.size===0)return;
        const num=this._valueNum_;
        if(Number.isNaN(num))return;
        let total=0;
        this._dice_.forEach(v=>void(total+=v.num));
        if(Number.isNaN(total))return;
        this._diceContainer_.classList.add(Roll[this._op_.value](num,total)?"success":"failure");
    }
    /**## [internal] Update {@linkcode Roll.chance} via {@linkcode Roll.Probability}*/
    _UpdateChance_(){
        /**@type {DiceType[]}*/const dice=[];
        this._dice_.forEach(v=>dice.push(v.type));
        this.chance=Roll.Probability(this._valueNum_,this._op_.value,dice);
        this._chance_.textContent=Roll.FormatPercent(this.chance);
        this._CallbackChance_();
    }
    /**## [internal] Update {@linkcode Roll._diceContainer_} class and {@linkcode Roll._chance_}*/
    _UpdateRow_(){
        this._diceContainer_.classList.remove("success","failure");
        this._UpdateClass_();
        this._UpdateChance_();
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
     * @param {(self:Roll)=>void} CallbackRemove - called when this roll (row) is removed from DOM and it's safe to delete this object (given as the first parameter)
     */
    constructor(CallbackRoll,CallbackRollEnd,CallbackChance,CallbackRemove){
        /**@type {DocumentFragment}*/const T=html.row.content.cloneNode(true);
        /**@type {HTMLDivElement}*/this.html=T.firstElementChild;
        /**@type {HTMLSpanElement}*/this._name_=T.querySelector("div.row>span");
        /**@type {HTMLInputElement}*/this._value_=T.querySelector("div.row>input");
        /**@type {HTMLSelectElement}*/this._op_=T.querySelector("div.row>select");
        /**@type {HTMLDivElement}*/this._diceContainer_=T.querySelector("div.row>div.dice");
        /**@type {HTMLSpanElement}*/this._chance_=T.querySelector("div.row>div.trail>span");
        /**@type {HTMLInputElement}*/this._add_=T.querySelector("div.row>div.trail>input");
        /**@type {HTMLSelectElement}*/this._addSelect_=T.querySelector("div.row>div.trail>select");
        html.sheet.append(T);
        /**@type {()=>void}*/this._CallbackRoll_=CallbackRoll;
        /**@type {()=>void}*/this._CallbackRollEnd_=CallbackRollEnd;
        /**@type {()=>void}*/this._CallbackChance_=CallbackChance;
        /**@type {(self:Roll)=>void}*/this._CallbackRemove_=CallbackRemove;
        /**@type {number} percentage (`[0,1]`) chance for this dice roll (row)*/
        this.chance=NaN;
        /**@type {Set<Dice>} [internal] collection of {@linkcode Dice} in {@linkcode Roll._diceContainer_}*/
        this._dice_=new Set();
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
        this._add_.addEventListener("click",()=>{
            this.AddDice(Number(this._addSelect_.value));
            this._UpdateRow_();
        },{passive:true});
        this._diceContainer_.addEventListener("dblclick",ev=>{
            if(ev.target!==this._diceContainer_)return;
            const bounds=this._diceContainer_.getBoundingClientRect();
            const offsetLeft=Math.trunc(bounds.right-Number.parseFloat(this._diceContainerStyle_.borderRightWidth)-ev.x);
            const offsetBottom=Math.trunc(bounds.bottom-Number.parseFloat(this._diceContainerStyle_.borderBottomWidth)-ev.y);
            if(offsetLeft<=0||offsetLeft>17||offsetBottom<=0||offsetBottom>17)return;
            ev.preventDefault();
            this._diceContainer_.style.removeProperty("width");
            this._diceContainer_.style.removeProperty("height");
        },{passive:false});
    }
    /**
     * ## Add a new {@linkcode Dice} to collection/HTML
     * aborts before exceeding {@linkcode Roll.MAX_DICE} and disables the add-a-dice button when reaching it
     * @param {DiceType} type
     */
    AddDice(type){
        if(this._dice_.size>=Roll.MAX_DICE)return;
        this._dice_.add(new Dice(type,this._diceContainer_,()=>{this._diceContainer_.classList.remove("success","failure");this._CallbackRoll_();},()=>{this._UpdateClass_();this._CallbackRollEnd_();},dice=>this._RemDice_(dice)));
        this._UpdateChance_();
        if(this._dice_.size>=Roll.MAX_DICE)this._add_.disabled=true;
    }
    /**## Rolls all dice within this collection*/
    RollAll(){this._dice_.forEach(v=>v.Roll());}
    /**
     * ## Remove all event listeners, saved {@linkcode Dice}, and {@linkcode Roll.html} from DOM
     * use before deleting obj
     */
    Remove(){
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
        this._add_.removeEventListener("click",()=>{
            this.AddDice(Number(this._addSelect_));
            this._UpdateRow_();
        });
        this._diceContainer_.removeEventListener("dblclick",ev=>{
            if(ev.target!==this._diceContainer_)return;
            const bounds=this._diceContainer_.getBoundingClientRect();
            const offsetLeft=Math.trunc(bounds.right-Number.parseFloat(this._diceContainerStyle_.borderRightWidth)-ev.x);
            const offsetBottom=Math.trunc(bounds.bottom-Number.parseFloat(this._diceContainerStyle_.borderBottomWidth)-ev.y);
            if(offsetLeft<=0||offsetLeft>17||offsetBottom<=0||offsetBottom>17)return;
            ev.preventDefault();
            this._diceContainer_.style.removeProperty("width");
            this._diceContainer_.style.removeProperty("height");
        });
        this._dice_.forEach(v=>v.Remove());
        this.html.remove();
        this._CallbackRemove_(this);
    }
};

