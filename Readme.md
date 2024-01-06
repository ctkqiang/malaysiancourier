## Malaysian Courier

This package track parcel(s) from different courierrs in Malaysia. The supported courier services are as below:

- Pos Laju
- J&T
- Pgeon
- Gdex
- DHL

This project will update from time to time. Feel free to contribute.

#### Installation:

```curl
npm install courier-my --save
```

#### Usage:

The javascript discipline used in this package is `ES6` where the `package.json` is set to `"type": "module"`

```javascript
import tracking from 'courier-my';

let t = new tracking('TRACKING_NUMBER');

let poslaju = await t.get_poslaju_tracking();
let jnt = await t.get_jnt_tracking();
let pegeon = await t.get_pgeon_tracking(`${YOUR_API_KEY}`);
let gdex = await t.get_gdex_tracking();
let dhl = await t.get_dhl_tracking(`${YOUR_API_KEY}`);
```
