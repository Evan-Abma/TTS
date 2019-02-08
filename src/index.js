import "@babel/polyfill";
import React from "react";
import { render } from "react-dom";
import ReactTable from "react-table";
import "react-table/react-table.css";
import axios from "axios";
import _ from "lodash";
import { polyfill } from 'es6-promise';

polyfill();

if (!Object.entries)
  Object.entries = function( obj ){
    var ownProps = Object.keys( obj ),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];

    return resArray;
  };

// Import React Table

const getData = (pageSize, page, sorted) => {
  return new Promise((resolve, reject) => {
    axios.get('http://localhost:8153/api.rsc/win_tts_dbo_t_tool/$metadata?@json')
    .then(function(response) {
      this.setState({ events: response.data });
    }.bind(this))
   .catch((error)=>{
      console.log(error);
   }); 
  // You can also use the sorting in your request, but again, you are responsible for applying it.
    const sortedData = _.orderBy(
      sorted.map(sort => {
        return row => {
          if (row[sort.id] === null || row[sort.id] === undefined) {
            return -Infinity;
          }
          return typeof row[sort.id] === "string"
            ? row[sort.id].toLowerCase()
            : row[sort.id];
        };
      }),
      sorted.map(d => (d.desc ? "desc" : "asc"))
    );
    const res = {
      rows: sortedData.slice(pageSize * page, pageSize * page + pageSize),
      pages: Math.ceil(sortedData.length / pageSize)
    };
    setTimeout(() => resolve(res), 500);
  });
};

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [],
      pages: null,
      loading: true
    };
    this.setState = this.setState.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }
  fetchData(state, instance) {
    // Whenever the table model changes, or the user sorts or changes pages, this method gets called and passed the current table model.
    // You can set the `loading` prop of the table to true to use the built-in one or show you're own loading bar if you want.
    this.setState({ loading: true });
    // Request the data however you want.  Here, we'll use our mocked service we created earlier
    getData(
      state.pageSize,
      state.page,
      state.sorted,
      state.filtered
    ).then(res => {
      // Now just get the rows of data to your React Table (and update anything else like total pages or loading)
      this.setState({
        data: res.rows,
        pages: res.pages,
        loading: false
      });
    });
  }
  render() {
    const { data, pages, loading } = this.state;
    return (
      <div>
        <ReactTable
          columns={[
            {
              Header: "ID",
              columns: [
                {
                  Header: "Tool ID",
                  accessor: "tool_id"
                },
                {
                  Header: "Barcode",
                  accessor: "bcode",
                }
              ]
            },
            {
              Header: "Info",
              columns: [
                {
                  Header: "Description",
                  accessor: "des"
                },
                {
                  Header: "Status",
                  accessor: "status"
                }
              ]
            },
            {
              Header: 'Stats',
              columns: [
                {
                  Header: "Bin Quantity",
                  accessor: "bin_qty"
                }
              ]
            }
          ]}
          manual // Forces table not to paginate or sort automatically, so we can handle it server-side
          data={data}
          pages={pages} // Display the total number of pages
          loading={loading} // Display the loading overlay when we need it
          onFetchData={this.fetchData} // Request new data when things change
          filterable
          defaultPageSize={10}
          className="-striped -highlight"
          onChange={this.handleChange.bind(this)}
        />
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));

export default App;
