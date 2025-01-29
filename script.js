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

