/**
 * This is not using webpack
 */

console.log('Using Mac license - No PACK Version');
Dynamsoft.WebTwainEnv.ProductKey = 'f0068NQAAAFsEPs/Oq0S+AZ25UDlYYgvj4verY4ShlP2FS3hHBj/rskJTTrNHdZzJHGZgFXSoHYKXG9AhYLVcnCs9YOAdg2U=';
Dynamsoft.WebTwainEnv.Trial = false;

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
