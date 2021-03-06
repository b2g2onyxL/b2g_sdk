const{Class}=require("../core/heritage");const{extend}=require("../util/object");const{MatchPattern}=require("../util/match-pattern");const readers=require("./readers");



const Context=Class({isRequired:false,isCurrent(target){throw Error("Context class must implement isCurrent(target) method");},get required(){Object.defineProperty(this,"required",{value:Object.assign(Object.create(Object.getPrototypeOf(this)),this,{isRequired:true})});return this.required;}});Context.required=function(...params){return Object.assign(new this(...params),{isRequired:true});};exports.Context=Context;


const isPage=Symbol("context/page?")
const PageContext=Class({extends:Context,read:{[isPage]:new readers.isPage()},isCurrent:target=>target[isPage]});exports.Page=PageContext;const isFrame=Symbol("context/frame?");const FrameContext=Class({extends:Context,read:{[isFrame]:new readers.isFrame()},isCurrent:target=>target[isFrame]});exports.Frame=FrameContext;const selection=Symbol("context/selection")
const SelectionContext=Class({read:{[selection]:new readers.Selection()},isCurrent:target=>!!target[selection]});exports.Selection=SelectionContext;const link=Symbol("context/link");const LinkContext=Class({extends:Context,read:{[link]:new readers.LinkURL()},isCurrent:target=>!!target[link]});exports.Link=LinkContext;const isEditable=Symbol("context/editable?")
const EditableContext=Class({extends:Context,read:{[isEditable]:new readers.isEditable()},isCurrent:target=>target[isEditable]});exports.Editable=EditableContext;const mediaType=Symbol("context/mediaType")
const ImageContext=Class({extends:Context,read:{[mediaType]:new readers.MediaType()},isCurrent:target=>target[mediaType]==="image"});exports.Image=ImageContext;const VideoContext=Class({extends:Context,read:{[mediaType]:new readers.MediaType()},isCurrent:target=>target[mediaType]==="video"});exports.Video=VideoContext;const AudioContext=Class({extends:Context,read:{[mediaType]:new readers.MediaType()},isCurrent:target=>target[mediaType]==="audio"});exports.Audio=AudioContext;const isSelectorMatch=Symbol("context/selector/mathches?")
const SelectorContext=Class({extends:Context,initialize(selector){this.selector=selector;

this[isSelectorMatch]=Symbol(selector);this.read={[this[isSelectorMatch]]:new readers.SelectorMatch(selector)};},isCurrent(target){return target[this[isSelectorMatch]];}});exports.Selector=SelectorContext;const url=Symbol("context/url");const URLContext=Class({extends:Context,initialize(pattern){this.pattern=new MatchPattern(pattern);},read:{[url]:new readers.PageURL()},isCurrent(target){return this.pattern.test(target[url]);}});exports.URL=URLContext;var PredicateContext=Class({extends:Context,initialize(isMatch){if(typeof(isMatch)!=="function"){throw TypeError("Predicate context mus be passed a function");}
this.isMatch=isMatch},isCurrent(target){return this.isMatch(target);}});exports.Predicate=PredicateContext;