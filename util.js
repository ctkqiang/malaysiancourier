export default class Util {
    log(msg, isdebug = true) {
        if (isdebug) {
            console.log(msg);
        } else {
            return null;
        }
    }

}