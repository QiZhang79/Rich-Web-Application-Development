$(document).ready(function(){
    $("#addBtn").on("click", addHandler);
    $("#cleBtn").on("click", clearHandler);
    $(".remove").on("click",function(){

    });
    initDBConnection();
    listItems();
});

function addHandler(){
    var subject = $("#subinput").val();
    var message = $("#mesinput").val();
    var name = $("#nameinput").val();
    if (subject == "" || message == "" || name == ""){
        alert("Fill all the fields!");
        $("#subinput").focus();
        return false;
    }

    var open = indexedDB.open("MyDatabase", 1);

    open.onsuccess = function() {
        // Start a new transaction
        var db = open.result;
        var tx = db.transaction("MessageStore", "readwrite");
        var store = tx.objectStore("MessageStore");

        var now = new Date();
        var date = now.toLocaleString('en-US',{year:'numeric', month: '2-digit', day:'2-digit'}).replace(/(\d+)\/(\d+)\/(\d+)/,'$3-$1-$2');
        var time = now.getHours() + ":" + now.getMinutes();
        // Add data
        store.put({subject: subject, message: message, date: date+" "+time, name: name});

        // Close the db when the transaction is done
        tx.oncomplete = function() {
            listItems();
            db.close();
        };
        clearHandler();
    };
}

function clearHandler(){
    $("#subinput").val("").focus();
    $("#mesinput").val("");
    $("#nameinput").val("");
}

function removeHandler(){
    var id = $(this).attr("data-id");
    var open = indexedDB.open("MyDatabase",1);
    open.onsuccess = function(){
        var db = open.result;
        var tx = db.transaction("MessageStore", "readwrite");
        var store = tx.objectStore("MessageStore");

        store.delete(parseInt(id));
        listItems();
    }
}

function showDetail(){
    $(".detail").hide();
    $(".confirm").hide();
    $(".edit").show();
    var target = $(this).parent().parent().next();
    $(target).show();
    $(target).next().show();
    $(target).next().find("input").each(function(index,obj){
        $(obj).attr("readonly",true);
    });
    $(target).next().find("textarea").each(function(index,obj){
        $(obj).attr("readonly",true);
    });
}

function closeDetail(){
    $(".detail").hide();
    $("#table").find("input").each(function(index,obj){
        $(obj).attr("readonly",true);
    });
    $("#table").find("textarea").each(function(index,obj){
        $(obj).attr("readonly",true);
    });
}

function enableEdit(){
    var row = $(this).parent().parent();
    $(this).hide();
    $(this).next().show();
    row.find("input").each(function(index,obj){
        $(obj).attr("readonly",false);
    });
    row.find("textarea").each(function(index,obj){
        $(obj).attr("readonly",false);
    });
}

function confirmEdit(){
    var id = $(this).attr("data-id"),row = $(this).parent().parent(),
        name=$(row).find(".edit-name").val(),
        subject=$(row).find(".edit-subject").val(),
        message=$(row).find(".edit-message").val();
    var open = indexedDB.open("MyDatabase");

    open.onsuccess = function(){
        var db = open.result;
        var transaction = db.transaction('MessageStore',"readwrite");
        var store = transaction.objectStore('MessageStore');
        var now = new Date();
        var date = now.toLocaleString('en-US',{year:'numeric', month: '2-digit', day:'2-digit'}).replace(/(\d+)\/(\d+)\/(\d+)/,'$3-$1-$2');
        var time = now.getHours() + ":" + now.getMinutes();
        var obj = {id: parseInt(id), message: message, name: name, subject: subject, date: date+" "+time};
        store.put(obj);
        listItems();
    };
}

function initDBConnection(){
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    var open = indexedDB.open("MyDatabase", 1);
    open.onupgradeneeded = function() {
        var db = open.result;
        var store = db.createObjectStore("MessageStore", {keyPath: "id", autoIncrement: true});
        var index = store.createIndex("MessageIndex", ["message.subject", "message.date", "message.words"]);
    };

}

function listItems(){
    var rows = $("#table").find("tr");
    if (rows.length > 1) {
        rows.each(function (index, row) {
            if (index > 0) {
                $(row).remove();
            }
        });
    }
    var open = indexedDB.open("MyDatabase",1);
    open.onsuccess = function(){
        var db = open.result;
        var transaction = db.transaction("MessageStore", "readwrite");
        var store = transaction.objectStore("MessageStore");
        var cursorRequest = store.openCursor(),index = 1;
        cursorRequest.onsuccess = function(event){
            var cursor = event.target.result;
            if(cursor) {
                // First Row
                var value = cursor.value;
                var row = document.createElement("tr");
                var noTd = document.createElement("td");
                noTd.innerHTML = index;
                $(row).append(noTd);
                var subjectTd = document.createElement("td");
                subjectTd.innerHTML = value.subject;
                $(row).append(subjectTd);
                var dateTd = document.createElement("td");
                dateTd.innerHTML = value.date;
                $(row).append(dateTd);
                var wordsTd = document.createElement("td");
                wordsTd.innerHTML = value.message.split(/\s+/).length;
                $(row).append(wordsTd);
                var operationTd = document.createElement("td");
                var seeBtn = document.createElement("button");
                seeBtn.className = "btn btn-success see";
                $(seeBtn).attr("data-id",value.id);
                seeBtn.innerHTML = "See";
                seeBtn.onclick = showDetail;
                $(operationTd).append(seeBtn).append(" ");
                var removeBtn = document.createElement("button");
                removeBtn.className = "btn btn-danger remove";
                $(removeBtn).attr("data-id",value.id);
                removeBtn.innerHTML = "Remove";
                removeBtn.onclick = removeHandler;
                $(operationTd).append(removeBtn);
                $(row).append(operationTd);
                // End of First Row

                // Hidden edit panel (title)
                var detailRowTitle = document.createElement("tr");
                detailRowTitle.className = "detail";
                var nameTd = document.createElement("td");
                nameTd.innerHTML = "Name";
                $(detailRowTitle).append(nameTd);
                var titleTd = document.createElement("td");
                titleTd.innerHTML = "Subject";
                $(detailRowTitle).append(titleTd);
                var messageTd = document.createElement("td");
                messageTd.innerHTML = "Message";
                messageTd.colSpan = 2;
                $(detailRowTitle).append(messageTd);
                var opTd = document.createElement("td");
                $(detailRowTitle).append(opTd);
                // End Hidden edit panel (title)

                // Hidden edit panel (input items)
                var detailRowContent = document.createElement("tr");
                detailRowContent.className = "detail";
                nameTd = document.createElement("td");
                nameTd.innerHTML = "<input type='text' class='edit-name' value='"+value.name+"' readonly/>";
                $(detailRowContent).append(nameTd);
                titleTd = document.createElement("td");
                titleTd.innerHTML = "<input type='text' class='edit-subject' value='"+value.subject+"' readonly/>";
                $(detailRowContent).append(titleTd);
                messageTd = document.createElement("td");
                messageTd.innerHTML = "<textarea class='edit-message' readonly>"+value.message+"</textarea>";
                messageTd.colSpan = 2;
                $(detailRowContent).append(messageTd);
                opTd = document.createElement("td");
                var editBtn = document.createElement("button");
                editBtn.className = "btn btn-warning edit";
                $(editBtn).attr("data-id",value.id);
                editBtn.innerHTML = "Edit";
                editBtn.onclick = enableEdit;
                $(opTd).append(editBtn).append(" ");
                var confirmBtn = document.createElement("button");
                confirmBtn.className = "btn btn-success confirm";
                $(confirmBtn).attr("data-id",value.id);
                confirmBtn.innerHTML = "Confirm";
                confirmBtn.onclick = confirmEdit;
                $(opTd).append(confirmBtn).append(" ");
                var closeBtn = document.createElement("button");
                closeBtn.className = "btn btn-danger";
                closeBtn.innerHTML = "Close";
                closeBtn.onclick = closeDetail;
                $(opTd).append(closeBtn);
                $(detailRowContent).append(opTd);
                // End Hidden edit panel (input items)

                $("#table").append(row).append(detailRowTitle).append(detailRowContent);

                index++;
                cursor.continue()
            }
        };


    };


}