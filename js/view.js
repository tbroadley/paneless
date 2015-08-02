// Represents the <textarea> or <iframe> tag inside a pane.
var Pane = React.createClass({
  setContent: function(event) {
    this.props.setContent(event.target.value);
  },

  render: function() {
    var type = this.props.type;
    var content = this.props.content;

    if (type === 'output') {
      return (
        <iframe
          className='content'
          srcDoc={content}
        />
      );
    } else {
      return (
        <textarea
          className='content'
          placeholder={PANE_TYPE_FULL_NAMES[type]}
          defaultValue={content}
          onChange={this.setContent}
        />
      );
    }
  }
});

// Represents the <select> tag that lets the user choose the type of a pane.
var PaneTypeSelector = React.createClass({
  setType: function(event) {
    var type = event.target.value;
    this.props.setType(type);
    // Update code location to default for the new type. Otherwise, the current
    // code location could be invalid for the new type.
    this.props.setCodeLocation(CODE_LOCATION_DEFAULTS[type]);
  },

  render: function() {
    return (
      <select value={this.props.type} onChange={this.setType}>
        {Object.keys(PANE_TYPE_FULL_NAMES).map(function(k) {
          return (
            <option value={k}>
              {PANE_TYPE_FULL_NAMES[k]}
            </option>
          );
        }, this)}
      </select>
    );
  }
});

// Represents the <select> tag that lets the user choose the code location of
// a pane.
var PaneCodeLocationSelector = React.createClass({
  setCodeLocation: function(event) {
    this.props.setCodeLocation(event.target.value);
  },

  render: function() {
    var thisCodeLocations = PANE_CODE_LOCATIONS[this.props.type];

    // If the current pane type has no associated code locations (e.g. an output
    // pane), do not return an element.
    if (Object.keys(thisCodeLocations).length === 0) {
      return false;
    } else {
      return (
        <select value={this.props.codeLocation} onChange={this.setCodeLocation}>
          {Object.keys(thisCodeLocations).map(function(k) {
            return (
              <option value={k}>
                {thisCodeLocations[k]}
              </option>
            );
          })}
        </select>
      );
    }
  }
});

// Wrapper for a <button> tag.
var ButtonWrapper = React.createClass({
  render: function() {
    var className = (this.props.showButton ? this.props.position : 'hidden')
      + (this.props.largeButton ? ' large' : '');

    return (
      <div className='flex'>
        <button
          className={className}
          onClick={this.props.onClick}
        >
          {this.props.content}
        </button>
      </div>
    );
  }
});

// Represents the header of a pane, which allows the user to change the pane's
// settings and deactivate it.
var PaneHeader = React.createClass({
  setInactive: function() {
    this.props.setActive(false);
  },

  render: function() {
    return (
      <div className='header'>
        <PaneTypeSelector
          type={this.props.type}
          setType={this.props.setType}
          setCodeLocation={this.props.setCodeLocation}
        />
        <PaneCodeLocationSelector
          type={this.props.type}
          codeLocation={this.props.codeLocation}
          setCodeLocation={this.props.setCodeLocation}
        />
        <ButtonWrapper
          position='absolute center-y right'
          content='X'
          onClick={this.setInactive}
          showButton
        />
      </div>
    );
  }
});

// Contains a pane's header and content. If the pane is inactive, allows the
// user to reactivate the pane.
var PaneContainer = React.createClass({
  setActive: function(active) {
    this.props.setActive(this.props.row, this.props.col, active);
  },

  handleEvent: function(f) {
    return function(val) {
      f(this.props.row, this.props.col, val);
    }.bind(this);
  },

  render: function() {
    var pane = this.props.pane;

    if (pane.active) {
      return (
        <div className='pane'>
          <PaneHeader
            type={pane.type}
            codeLocation={pane.codeLocation}
            setActive={this.handleEvent(this.props.setActive)}
            setType={this.handleEvent(this.props.setType)}
            setCodeLocation={this.handleEvent(this.props.setCodeLocation)}
          />
          <Pane
            type={pane.type}
            content={pane.content}
            setContent={this.handleEvent(this.props.setContent)}
          />
        </div>
      );
    } else {
      return (
        <div className='pane inactive'>
          <ButtonWrapper
            position='absolute center-x center-y'
            content='+'
            onClick={this.setActive.bind(this, true)}
            showButton
          />
        </div>
      );
    }
  }
});

// Allows the user to remove the associated row or column, and to add rows or
// columns before and/or after it.
var RowColumnController = React.createClass({
  render: function() {
    var isRow = this.props.orientation === 'row';
    var beforePos = 'absolute ' + (isRow ? 'center-y left' : 'center-x top');
    var afterPos = 'absolute ' + (isRow ? 'center-y right' : 'center-x bottom');

    return (
      <div className={'pane adder ' + this.props.orientation}>
        <ButtonWrapper
          position={beforePos}
          content='+'
          onClick={this.props.addBefore}
          showButton={this.props.isFirst}
        />
        <ButtonWrapper
          position='absolute center-x center-y'
          content='-'
          onClick={this.props.remove}
          showButton={this.props.allowRemoval}
        />
        <ButtonWrapper
          position={afterPos}
          content='+'
          onClick={this.props.addAfter}
          showButton
        />
      </div>
    );
  }
});

// Represents the row at the top of the screen that contains the column removal
// buttons for each column.
var ColumnRemoverRow = React.createClass({
  addCol: function(col) {
    this.props.addCol(col);
  },

  removeCol: function(col) {
    this.props.removeCol(col);
  },

  render: function() {
    // This empty row removal <div> keeps the column remover buttons in line
    // with the columns.
    var emptyRowRemover = (
      <div className='pane adder col'>
        <ButtonWrapper
          content='-'
          showButton={false}
        />
      </div>
    );

    return (
      <div className='pane-row adder'>
        {emptyRowRemover}
        {range(this.props.cols).map(function(col) {
          return (
            <RowColumnController
              orientation='row'
              isFirst={col === 0}
              allowRemoval={this.props.cols > 1}
              addBefore={this.addCol.bind(this, 0)}
              addAfter={this.addCol.bind(this, col + 1)}
              remove={this.removeCol.bind(this, col)}
            />
          );
        }, this)}
      </div>
    );
  }
});

// Represents one row of panes.
var PaneRow = React.createClass({
  render: function() {
    var rowRemover = (
      <RowColumnController
        orientation='col'
        isFirst={this.props.row === 0}
        allowRemoval={this.props.moreThanOneRow}
        addBefore={this.props.addRowAbove}
        addAfter={this.props.addRowBelow}
        remove={this.props.removeRow}
      />
    );

    return (
      <div className='pane-row'>
        {rowRemover}
        {range(this.props.paneRow.length).map(function(col) {
          return (
            <PaneContainer
              row={this.props.row}
              col={col}
              pane={this.props.paneRow[col]}
              setActive={this.props.setActive}
              setType={this.props.setType}
              setCodeLocation={this.props.setCodeLocation}
              setContent={this.props.setContent}
            />
          );
        }, this)}
      </div>
    );
  }
});

// Represents a 2D grid of panes.
var PaneGrid = React.createClass({
  render: function() {
    var model = this.props.model;
    var callModelFunction = this.props.callModelFunction;

    return (
      <div className='pane-container'>
        <ColumnRemoverRow
          cols={model.cols}
          addCol={callModelFunction('addCol')}
          removeCol={callModelFunction('removeCol')}
        />
        {range(model.rows).map(function(row) {
          return (
            <PaneRow
              row={row}
              paneRow={model.grid[row]}
              moreThanOneRow={model.rows > 1}
              addRowAbove={callModelFunction('addRow').bind(this, row)}
              addRowBelow={callModelFunction('addRow').bind(this, row + 1)}
              removeRow={callModelFunction('removeRow').bind(this, row)}
              setActive={callModelFunction('setActive')}
              setType={callModelFunction('setType')}
              setCodeLocation={callModelFunction('setCodeLocation')}
              setContent={this.props.setContent}
            />
          );
        }, this)}
      </div>
    );
  }
});

// Lets the user refresh the content, and choose whether or not the content
// will be refreshed automatically.
var RefreshSettings = React.createClass({
  setAutoRefresh: function(event) {
    this.props.setAutoRefresh(event.target.checked);
  },

  render: function() {
    return (
      <div className='pane'>
        <ButtonWrapper
          position='left center-y'
          content='Refresh'
          onClick={this.props.refresh}
          showButton
          largeButton
        />
        <div>
          <input
            type='checkbox'
            checked={this.props.autoRefresh}
            onChange={this.setAutoRefresh}
          />
          Automatically refresh the page on edit
        </div>
      </div>
    );
  }
});

// Represents the footer div.
var PanelessFooter = React.createClass({
  render: function() {
    var emptyRowRemover = (
      <div className='pane adder col'>
        <ButtonWrapper
          content='-'
          showButton={false}
        />
      </div>
    );

    return (
      <div className='footer'>
        {emptyRowRemover}
        <RefreshSettings
          refresh={this.props.refresh}
          autoRefresh={this.props.autoRefresh}
          setAutoRefresh={this.props.setAutoRefresh}
        />
      </div>
    );
  }
});

// The model that the application is based on.
var model = new PaneGridModel(2, 2, GRID_ATTRIBUTE_DEFAULTS);

// The top-level class for the application's view.
var Paneless = React.createClass({
  getInitialState: function() {
    return {
      model: model,
      autoRefresh: true,
    };
  },

  // This function should be called after the model has been updated.
  // It clears the timer that is set by setContent, so that the model is not
  // updated more than once.
  updateState: function() {
    var timer = this.inputTimer;
    if (typeof timer !== 'undefined') {
      clearTimeout(timer);
    }

    this.setState({
      model: model
    });
  },

  // Returns a function that applies the given arguments to the function fName
  // of the model, then updates the component's state.
  callModelFunction: function(fName) {
    return function() {
      // Call model's function fName on the given arguments.
      this.state.model[fName].apply(model, arguments);
      this.updateState();
    }.bind(this);
  },

  // When the user types in one of the <textarea> tags, the application will
  // wait for TYPING_TIMEOUT seconds before notifying React that the model has
  // been updated. If the user changes the model in the meantime, the timeout
  // will be reset.
  setContent: function(row, col, content) {
    model.setContent(row, col, content);

    if (this.state.autoRefresh) {
      var timer = this.inputTimer;
      if (typeof timer !== 'undefined') {
        clearTimeout(timer);
      }

      this.inputTimer = setTimeout(this.updateState, TYPING_TIMEOUT);
    }
  },

  // Sets whether the content will be automatically refreshed upon typing.
  setAutoRefresh: function(autoRefresh) {
    this.setState({
      autoRefresh: autoRefresh
    });
  },

  render: function() {
    return(
      <div className='paneless'>
        <PaneGrid
          model={this.state.model}
          callModelFunction={this.callModelFunction}
          setContent={this.setContent}
        />
        <PanelessFooter
          refresh={this.updateState}
          autoRefresh={this.state.autoRefresh}
          setAutoRefresh={this.setAutoRefresh}
        />
      </div>
    );
  }
});

// Render the top-level class of the application.
React.render(<Paneless />, document.getElementById('root'));
