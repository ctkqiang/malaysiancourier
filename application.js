/**
 * @author: John Melody Me <johnmelodyme@yandex.com>
 */
import axios from "axios";
import util from "./util.js";
import cheerio from "cheerio";
import * as https from "https";

let _ = new util();

export default class MalaysianCourierService {
  /**
   * @description This method set the is_debug at true
   * which will console.log the output to the terminal.
   * Set to false for a production, which will not console
   * out.
   */
  constructor(trackingNumber, courierName) {
    if (trackingNumber == undefined) throw new Error("Tracking Number Needed");

    this.tracking_number = tracking_number;
    this.is_debug = is_debug;
    this.err = "The tracking number shouldn't left empty";
    this.pos_laju = "https://sendparcel.poslaju.com.my/open/trace";
    this.jnt = "https://www.jtexpress.my/tracking/";
    this.dhl = "https://api-eu.dhl.com/track/shipments";
    this.pgeon = "https://public-api.pgeon.delivery/public/tracking/";
    this.gdex = "https://esvr5.gdexpress.com/WebsiteEtracking/Home/Etracking/";
    this.fedex = "https://apis-sandbox.fedex.com/track/v1/trackingnumbers";
    this.tnt = "https://www.tnt.com/api/v3/shipment";
    this.cjexpress =
      "https://mysgnexs.cjlogistics-global.com/web/g_tracking_eng.jsp";
    this.urban_fox = "https://dp.urbanfox.asia/api/gql";
    this.teleport = "https://teleport.delivery/api/1/order-item-track";

    https.globalAgent.options.rejectUnauthorized = false;
  }

  /**
   * This Method get specific tracking of the pos laju parcel.
   * The prefix must contain either one of these 'EE', 'EH', 'EP', 'ER',
   * 'EN', 'EM', 'PL', otherwise it return exception.
   */
  async get_poslaju_tracking() {
    let prefixes;
    let result;
    let data = [];

    prefixes = ["EE", "EH", "EP", "ER", "EN", "EM", "PL"];

    if (this.tracking_number == undefined) {
      result = {
        message: this.err,
      };

      _.log(result, this.is_debug);

      return result;
    } else {
      if (prefixes.includes(this.tracking_number.substring(0, 2))) {
        let response = await axios.get(this.pos_laju, {
          params: {
            tno: this.tracking_number,
          },
        });

        let $ = cheerio.load(response.data);

        $("tr").each((index, element) => {
          if (index === 0) return true;

          let get_td = $(element).find("td");
          let datetime = $(get_td[0]).text();
          let status = $(get_td[1]).text();
          let location = $(get_td[2]).text();
          let row_of_the_table = {
            datetime,
            status,
            location,
          };

          data.push(row_of_the_table);
        });

        result = {
          status: response["status"],
          protocol: response["request"]["protocol"],
          tracking_data: data,
        };

        _.log(result, this.is_debug);

        return result;
      } else {
        result = {
          message: "The Prefix are not from POSLAJU!",
        };

        _.log(result, this.is_debug);

        return result;
      }
    }
  }

  async get_gdex_tracking() {
    let $;
    let table;
    let result;
    let final_data;
    let response;
    let configuration;

    if (this.tracking_number == undefined) {
      result = {
        message: this.err,
      };

      return result;
    } else {
      configuration = {
        params: {
          id: "GDEX",
          input: this.tracking_number,
        },
      };

      response = await axios(this.gdex, configuration);

      $ = cheerio.load(response["data"]);

      table = $("tr");
      final_data = [];

      for (let i = 0; i < table.length; i++) {
        let _consignment = $(table).find("td")[0];
        let _datetime = $(table[i]).find("td")[1];
        let _status = $(table[i]).find("td")[2];
        let _location = $(table[i]).find("td")[3];

        let consignment = $(_consignment).text();
        let datetime = $(_datetime).text();
        let status = $(_status).text();
        let location = $(_location).text();

        let table_data = {
          consignment,
          status,
          location,
          datetime,
        };

        final_data.push(table_data);
      }

      _.log(final_data, this.is_debug);

      return final_data;
    }
  }

  async get_jnt_tracking() {
    let result;

    if (this.tracking_number == undefined) {
      result = {
        message: this.err,
      };

      return result;
    } else {
      if (this.tracking_number.substring(0, 1) == 6) {
        let $;
        let n;
        let response;
        let jnt_data;
        let message = [];
        let status = [];
        let time = [];
        let date = [];
        let data = [];

        response = await axios.get(this.jnt + this.tracking_number, {
          strictSSL: false,
        });

        $ = cheerio.load(response["data"]);

        $(".fw-light").each((index, element) => {
          if (index <= 0) return "Not Found";

          n = index;

          message.push($(element).text().trim());
        });

        $("b").each((index, element) => {
          if (index <= 0) return "Not Found";

          status.push($(element).text().trim());
        });

        $(".fw-b").each((index, element) => {
          if (index <= 0) return "Not Found";

          time.push($(element).text().trim());
        });

        $(".text-sm-end").each((index, element) => {
          if (index <= 0) return "Not Found";

          date.push($(element).text().trim());
        });

        for (let i = 0; i < n; i++) {
          data.push({
            status: status[i] == undefined ? "" : status[i],
            message: message[i] == undefined ? "" : message[i],
            time: time[i] == undefined ? "" : time[i],
            date: date[i] == undefined ? "" : date[i],
          });
        }

        jnt_data = Object.assign({}, data);

        _.log(jnt_data, this.is_debug);

        return jnt_data;
      } else {
        result = {
          message: "The prefix is not belong to J&T",
        };

        return result;
      }
    }
  }

  /**
   * @param {string} PGEON_API_KEY required integration for request
   * from: {@url https://www.pgeon.delivery/portal/api-request}
   * +------+---------------------------------------------+
   * | Code |                 Description                 |
   * + -- - + -- -- -- -- -- - -- -- -- -- -- -- -- -- -- +
   * | 1    | Order is received                           |
   * | 2    | Parcel drop off at pgeon point              |
   * | 3    | Parcel has been collected at pgeon point    |
   * | 4    | Parcel arrived at pgeon point               |
   * | 5    | Receiver collected parcel at pgeon point    |
   * | 6    | Sender taken back parcel at pgeon point     |
   * | 7    | Recollect courier parcel at pgeon point     |
   * | 8    | Courier take back parcel from pgeon point   |
   * | 9    | Receiver put back the parcel at pgeon point |
   * | 10   | Out of Collection                           |
   * | 11   | Collection attempted                        |
   * | 12   | Collected                                   |
   * | 13   | Arrived Pgeon Hub                           |
   * | 14   | Ready to ship out from sorting hub          |
   * | 15   | 3 pl tracking status                        |
   * | 17   | Out for delivery                            |
   * | 18   | Delivery attempted                          |
   * | 19   | Delivered recipient                         |
   * | 20   | On Hold                                     |
   * | 25   | Return is initiated                         |
   * | 30   | Returned to sender                          |
   * + -- -- -- - -- -- -- -- - -- -- -- -- -- -- -- -- - +
   */
  async get_pgeon_tracking(PGEON_API_KEY) {
    let configuration;
    let response;

    let path = `${this.pgeon + this.tracking_number}`;

    configuration = {
      method: "GET",
      url: path,
      headers: {
        apikey: PGEON_API_KEY,
        "Content-Type": "application/json",
      },
    };

    response = await axios(configuration);

    _.log(response["data"], this.is_debug);

    return response["data"];
  }

  /**
   * @param {string} DHL_API_KEY Required for
   * authentication. Refer to DHL website
   * for API :{@url https://bit.ly/3mSTUlH}
   * @param {string} SERVICE Required for
   * specific parcel services, Options are
   * 'ecommerce', 'freight', 'express', 'parcel-de',
   * 'parcel-nl', 'parcel-pl', 'parcel-uk'
   */
  async get_dhl_tracking(DHL_API_KEY, SERVICE = "ecommerce") {
    let response;
    let configuration;

    if (this.tracking_number == undefined) {
      return (response = {
        message: err,
      });
    } else {
      configuration = {
        url: this.dhl,
        headers: {
          Accept: "application/json",
          "DHL-API-Key": DHL_API_KEY,
        },
        params: {
          trackingNumber: this.tracking_number,
          service: SERVICE,
        },
      };

      response = await axios(configuration);

      return response["data"]["shipments"][0]["status"];
    }
  }

  // https://www.fedex.com/fedextrack/?trknbr=283427755288&trkqual=2459466000~283427755288~FX
  async get_fedex_tracking(FEDEX_API_KEY) {
    let body = {};

    let configuration = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-locale": "en_US",
        Authorization: "Bearer",
      },
      url: this.fedex,
      body: body,
    };

    // let response = await axios(configuration);
  }

  async get_tnt_tracking() {
    let body = {
      method: "GET",
      params: {
        con: this.tracking_number,
        locale: "en_GB",
        searchType: "CON",
        channel: "OPENTRACK",
      },
      url: this.tnt,
    };

    let response = await axios(body);

    return response["data"]["tracker.output"]["consignment"][0]["events"];
  }

  async get_cjexpress_tracking() {
    let response = [];
    let configuration = {
      params: {
        slipno: this.tracking_number,
      },
      url: this.cjexpress,
    };

    let data = await axios(configuration);

    let $ = cheerio.load(data["data"]);

    $("tr").each(function (index, element) {
      if (index === 0) return true;

      let table = $(element).find("td");
      let datetime = $(table[0]).text().replace(/\s/g, "");
      let status = $(table[1]).text().replace(/\s/g, "");
      let description = $(table[2]).text().replace(/\s/g, "");
      let location = $(table[3]).text().replace(/\s/g, "");

      let row_of_the_table = {
        datetime,
        status,
        description,
        location,
      };

      response.push(row_of_the_table);
    });

    return response;
  }

  async get_urban_fox_tracking() {
    let response = await axios.post(this.url, {
      query: `query _ { transaction_tracking_details(track_id:\"${this.tracking_number}\", customer:\"public\") { ref_no status scheduled_date list { activity activity_date loc_lat loc_lng }}}`,
    });

    return response["data"]["data"]["transaction_tracking_details"];
  }

  async get_teleport_tracking() {
    let params = new URLSearchParams();

    params.append("tracking_numbers", [this.tracking_number]);

    let response = await axios.post(this.teleport, params);

    return response["data"];
  }
}
