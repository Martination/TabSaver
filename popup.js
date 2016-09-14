/**
 * TabSaver will store the currently selected tab into LocalStorage and
 * create a table listing all such entries, allowing the user to reopen
 * previously saved tabs. 
 *
 * @summary TabSaver popup.js to control functionality of extension
 *
 * @author Martin Green
 * @copyright 2016
 */


document.addEventListener('DOMContentLoaded', function() {

  // Initialize localStorage
  if (!localStorage.tabList) localStorage.tabList = JSON.stringify([]);
  if (!localStorage.tabListBackup) localStorage.tabListBackup = JSON.stringify([]);

  console.log(localStorage.tabList);
  console.log(localStorage.tabList.length);
  console.log(localStorage.tabListBackup.length);

  createTable();      // Populate the list with all saved websites
  loadTabInfo();      // Load current tab info to display in header
  savePageListener(); // onClick listener for Save button
  listCleanup();      // onClick listener for Clear / Restore button
}, false);

// Constructor for Tab objects
function Tab(url, title) {
  this.url = url;
  this.title = title;
}

function createTable() {
  var tableBody = "";
  var allTabs = JSON.parse(localStorage.tabList);
  allTabs.forEach(function(tab) {
    tableBody += "<tr><td width='16'><img src='chrome://favicon/" + tab.url + 
          "' width='16' height='16' /></td><td>" + tab.title + "</td><td>" + tab.url + "</td></tr>";
  });
  document.getElementById("tabs").innerHTML = tableBody;
  addRowHandlers();
}

function loadTabInfo() {
  chrome.tabs.query(
    {currentWindow: true, active : true},
    function(tab) {
      var title = tab[0].title;
      if (title.length > 45) {
        title = title.substring(0, 40) + "...";
      }
      document.getElementById("curTab").innerHTML = "Save tab: " + title;
    }
  );
}

function savePageListener() {
  var savePageButton = document.getElementById("save_button");
  savePageButton.addEventListener("click", function() {

    chrome.tabs.query(
      {currentWindow: true, active : true},
      function(tab) {
        var currentTab = new Tab(tab[0].url, tab[0].title);

        // Check if page has already been saved
        if (!localStorage.tabList.includes(JSON.stringify(currentTab))) {
          var tabList = JSON.parse(localStorage.tabList);
          tabList.push(currentTab);
          localStorage.tabList = JSON.stringify(tabList);
          createTable();
        }
        savePageButton.value = "Saved!";
      }
    );
  }, false);
}

function listCleanup() {
  var deleteAllButton = document.getElementById("delete_button");
  if (localStorage.tabList.length < 5 && localStorage.tabListBackup.length > 5) {
    deleteAllButton.value = "Restore";
  } else {
    deleteAllButton.value = "Clear";
  }

  deleteAllButton.addEventListener("click", function() {
    if (deleteAllButton.value == "Clear") {
      console.log("removed all items");
      localStorage.tabListBackup = localStorage.tabList;
      localStorage.tabList = JSON.stringify([]);
      document.getElementById("delete_button").value = "Restore";
    } else {
      console.log("restored to backup");
      localStorage.tabList = localStorage.tabListBackup;
      document.getElementById("delete_button").value = "Clear";
    }
    createTable();
    document.getElementById("save_button").value = "Save";
  }, false);
}

function addRowHandlers() {
  var table = document.getElementById("table");
  var rows = table.getElementsByTagName("tr");

  chrome.tabs.query(
    {currentWindow: true, active : true},
    function(tab) {
      for (i = 0; i < rows.length; i++) {
        var currentRow = table.rows[i];
        var createClickHandler = function(row) {
          return function() {
            var title = row.getElementsByTagName("td")[1].innerHTML;
            var url = row.getElementsByTagName("td")[2].innerHTML;

            title = title.replace(/&amp;/g, "&").replace(/&gt;/g, ">")
                          .replace(/&lt;/g, "<").replace(/&quot;/g, "'").replace(/&#039/g, '"');
            url = url.replace(/&amp;/g, "&").replace(/&gt;/g, ">")
                          .replace(/&lt;/g, "<").replace(/&quot;/g, "'").replace(/&#039/g, '"');

            var newTab = new Tab(url, title);
            var tabString = JSON.stringify(newTab);

            // Homogenizes whitespace characters to allow .replace to work reliably
            localStorage.tabList = localStorage.tabList.replace(/\s/g, " ");
            localStorage.tabList = localStorage.tabList.replace(tabString,"");  // Remove entry

            localStorage.tabList = localStorage.tabList.replace("{}", "");      // Clean up empty entries
            localStorage.tabList = localStorage.tabList.replace(",,", ",");     // Remove leftover characters from middle ...
            localStorage.tabList = localStorage.tabList.replace("[,", "[");     // ... beginning ...
            localStorage.tabList = localStorage.tabList.replace(",]", "]");     // ... and end


            chrome.tabs.create({ url: url, index: tab[0].index + 1, openerTabId: tab[0].id });
          };
        };

        currentRow.onclick = createClickHandler(currentRow);
      }
    }
  );
}