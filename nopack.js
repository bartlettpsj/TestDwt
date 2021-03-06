/**
 * This is not using webpack
 */

// console.log('Using Mac license - No PACK Version');
// Dynamsoft.WebTwainEnv.ProductKey = 'f0068NQAAAFsEPs/Oq0S+AZ25UDlYYgvj4verY4ShlP2FS3hHBj/rskJTTrNHdZzJHGZgFXSoHYKXG9AhYLVcnCs9YOAdg2U=';
console.log('Using Windows license - No PACK Version');
Dynamsoft.WebTwainEnv.ProductKey = 'f0068NQAAAHyXpWtN2w3efU3yzeztfKjyTKGgVzH2+qlGxuJ85jP21VXJIP0NRLox9ELZUNc/VA+jzAupkSMA+EnH9dq/H3o=';
Dynamsoft.WebTwainEnv.Trial = false;
// Dynamsoft.WebTwainEnv.ResourcesPath = "http://pauls-imac:4000/Resources";
Dynamsoft.WebTwainEnv.ResourcesPath = "Resources";


Dynamsoft.WebTwainEnv.Containers = [{ContainerId:'dwtcontrolContainer',Width:830,Height:350}];
Dynamsoft.WebTwainEnv.Load();
Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTwainReady', Dynamsoft_OnReady);  // Register OnWebTwainReady event. This event fires as soon as Dynamic Web TWAIN is initialized and ready to be used

var DWObject;

function Dynamsoft_OnReady() {
  DWObject = Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer');    // Get the Dynamic Web TWAIN object that is embeded in the div with id 'dwtcontrolContainer'
  console.log('OnReady in nopack', DWObject);

  if (DWObject) {
    var count = DWObject.SourceCount;
    for (var i = 0; i < count; i++)
      document.getElementById("source").options.add(new Option(DWObject.GetSourceNameItems(i), i)); // Get Data Source names from Data Source Manager and put them in a drop-down box
  }
}

function AcquireImage() {
  if (DWObject) {
    var OnAcquireImageSuccess, OnAcquireImageFailure;
    OnAcquireImageSuccess = OnAcquireImageFailure = function (){
      DWObject.CloseSource();
    };

    DWObject.SelectSourceByIndex(document.getElementById("source").selectedIndex); //Use method SelectSourceByIndex to avoid the 'Select Source' dialog
    DWObject.OpenSource();
    DWObject.IfDisableSourceAfterAcquire = true;	// Scanner source will be disabled/closed automatically after the scan.
    DWObject.AcquireImage(OnAcquireImageSuccess, OnAcquireImageFailure);
  }
}

function showLoadDialog() {
  console.log('Loading image - ', DWObject);
  if (DWObject) {
    DWObject.IfShowFileDialog = true;

    DWObject.LoadImageEx("",
      EnumDWT_ImageType.IT_ALL,
      () => {     console.log('Load Image Zoom initial: ' + DWObject.Zoom); }, // Success
      (errorCode, errorString) => { console.log(errorCode); }); // Failure
  }
}

function uploadImage() {
  DWObject.HTTPUpload('localhost:3000/api/images?access_token=jXO0ygDP4VzWFznJxXT5qiPPLHknjGBt6R1wQbtBl8jVQ0lnqHjFN2J3XkKz5N1l',
    [0], // indices,
    EnumDWT_ImageType.IT_PDF,
    EnumDWT_UploadDataFormat.Binary,
    (httpResponse) => { console.log('Success'); },
    (errorCode, errorString) => { console.log('Failure', errorCode, errorString); }
  );
}

function unloadWebTwain() {
  console.log('Unloading WebTwain');
  if (DWObject) {
    Dynamsoft.WebTwainEnv.Unload();
    console.log('Unloaded completed.');
  }
}

function loadWebTwain() {
  console.log('Loading WebTwain');

  Dynamsoft.WebTwainEnv.Load();
  console.log('Load completed.');
}
