/**
 * jquery.plupload.queue.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

// JSLint defined globals
/*global plupload:false, jQuery:false, alert:false */

(function($) {
  var uploaders = {};

  function _(str) {
    return plupload.translate(str) || str;
  }

  function renderUI(id, target) {
    // Remove all existing non plupload items
    target.contents().each(function(i, node) {
      node = $(node);

      if (!node.is('.plupload')) {
        node.remove();
      }
    });

    target.prepend(
      '<div class="plupload_wrapper plupload_scroll">' +
        '<div id="' + id + '_container" class="plupload_container">' +
          '<div class="plupload">' +
            '<div class="plupload_header">' +
              '<div class="plupload_header_content">' +
                '<div class="plupload_header_title">' + _('Select files') + '</div>' +
                '<div class="plupload_header_text">' + _('Add files to the upload queue and click the start button.') + '</div>' +
              '</div>' +
            '</div>' +

            '<div class="plupload_content">' +
              '<div class="plupload_filelist_header">' +
                '<div class="plupload_file_name">' + _('Filename') + '</div>' +
                '<div class="plupload_file_action">&nbsp;</div>' +
                '<div class="plupload_file_status"><span>' + _('Status') + '</span></div>' +
                '<div class="plupload_file_size">' + _('Size') + '</div>' +
                '<div class="plupload_clearer">&nbsp;</div>' +
              '</div>' +

              '<ul id="' + id + '_filelist" class="plupload_filelist"></ul>' +

              '<div class="plupload_filelist_footer">' +
                '<div class="plupload_file_name">' +
                  '<div class="plupload_buttons">' +
                    '<a href="#" class="plupload_button plupload_add">' + _('Add files') + '</a>' +
                    '<a href="#" class="plupload_button plupload_start">' + _('Start upload') + '</a>' +
                  '</div>' +
                  '<span class="plupload_upload_status"></span>' +
                '</div>' +
                '<div class="plupload_file_action"></div>' +
                '<div class="plupload_file_status"><span class="plupload_total_status">0%</span></div>' +
                '<div class="plupload_file_size"><span class="plupload_total_file_size">0 b</span></div>' +
                '<div class="plupload_progress">' +
                  '<div class="plupload_progress_container">' +
                    '<div class="plupload_progress_bar"></div>' +
                  '</div>' +
                '</div>' +
                '<div class="plupload_clearer">&nbsp;</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<input type="hidden" id="' + id + '_count" name="' + id + '_count" value="0" />' +
      '</div>'
    );
  }

  $.fn.pluploadQueue = function(settings) {
    if (settings) {
      this.each(function() {
        var uploader, target, id, showDocumentType, documentTypeOptions, documentTypeSelect;

        showDocumentType = (settings.documentTypeParam && settings.documentTypeUrl);
        if (showDocumentType) {
          var select = '';
          $.ajax({
            url: settings.documentTypeUrl,
            dataType: 'json',
            success: function(data, status, xhr){
              if (!$.isArray(data) || data.length < 1) {
                showDocumentType = false;
                return false;
              }
              $(data).each(function() {
                var dataMap = null;
                for (var firstKey in this) break;
                  dataMap = this[firstKey]
                select += '<option value="' + dataMap.id + '">' + dataMap.name + '</option>'
              })
              documentTypeSelect = '<select name="plupload_file_type"><option value=""></option>' + select + '</select>';
              $('#plupload_file_type', target).html('').append($(documentTypeSelect));
            }
          });
 
        }
        target = $(this);
        id = target.attr('id');

        if (!id) {
          id = plupload.guid();
          target.attr('id', id);
        }

        uploader = new plupload.Uploader($.extend({
          dragdrop : true,
          container : id
        }, settings));

        // Call preinit function
        if (settings.preinit) {
          settings.preinit(uploader);
        }

        uploaders[id] = uploader;

        function handleStatus(file) {
          var actionClass;

          if (file.status == plupload.DONE) {
            actionClass = 'plupload_done';
          }

          if (file.status == plupload.FAILED) {
            actionClass = 'plupload_failed';
          }

          if (file.status == plupload.QUEUED) {
            actionClass = 'plupload_delete';
          }

          if (file.status == plupload.UPLOADING) {
            actionClass = 'plupload_uploading';
          }

          $('#' + file.id).attr('class', actionClass).find('a').css('display', 'block');
        }

        function updateTotalProgress() {
          $('span.plupload_total_status', target).html(uploader.total.percent + '%');
          $('div.plupload_progress_bar', target).css('width', uploader.total.percent + '%');
          $('span.plupload_upload_status', target).text('Uploaded ' + uploader.total.uploaded + '/' + uploader.files.length + ' files');

          // All files are uploaded
          if (uploader.total.uploaded == uploader.files.length) {
            uploader.stop();
          }
        }

        function updateList() {
          var fileList = $('ul.plupload_filelist', target).html(''), inputCount = 0, inputHTML;
          $.each(uploader.files, function(i, file) {
            inputHTML = '';

            if (file.status == plupload.DONE) {
              if (file.target_name) {
                inputHTML += '<input type="hidden" name="' + id + '_' + inputCount + '_tmpname" value="' + plupload.xmlEncode(file.target_name) + '" />';
              }

              inputHTML += '<input type="hidden" name="' + id + '_' + inputCount + '_name" value="' + plupload.xmlEncode(file.name) + '" />';
              inputHTML += '<input type="hidden" name="' + id + '_' + inputCount + '_status" value="' + (file.status == plupload.DONE ? 'done' : 'failed') + '" />';
  
              inputCount++;

              $('#' + id + '_count').val(inputCount);
            }

            fileList.append(
              '<li id="' + file.id + '">' +
                '<div class="plupload_file_name"><span>' + file.name + '</span></div>' +
                (showDocumentType ? 
                '<div class="plupload_file_type">' + documentTypeSelect + '</div>' : '') +
                '<div class="plupload_file_action"><a href="#"></a></div>' +
                '<div class="plupload_file_status">' + file.percent + '%</div>' +
                '<div class="plupload_file_size">' + plupload.formatSize(file.size) + '</div>' +
                '<div class="plupload_clearer">&nbsp;</div>' +
                inputHTML +
              '</li>'
            );

            var $docTypeSelect = $('li[id=' + file.id + '] div.plupload_file_type select', target);
            $docTypeSelect.val(file.type).attr('disabled', (file.percent == 100));
            
            
            handleStatus(file);

            $('#' + file.id + '.plupload_delete a').click(function(e) {
              $('#' + file.id).remove();
              uploader.removeFile(file);

              e.preventDefault();
            });
          });
          
          $('select', target).change(function() {
            var $select = $(this);
            var id = $select.parent().parent().attr('id');
            $.each(uploader.files, function(i, file) {
              if (file.id == id) {
                file.type = $select.val();
                return false;
              }
            });
          });


          $('span.plupload_total_file_size', target).html(plupload.formatSize(uploader.total.size));

          if (uploader.total.queued === 0) {
            $('span.plupload_add_text', target).text(_('Add files.'));
          } else {
            $('span.plupload_add_text', target).text(uploader.total.queued + ' files queued.');
          }

          $('a.plupload_start', target).toggleClass('plupload_disabled', uploader.files.length === 0);

          // Scroll to end of file list
          fileList[0].scrollTop = fileList[0].scrollHeight;

          updateTotalProgress();

          // Re-add drag message if there is no files
          if (!uploader.files.length && uploader.features.dragdrop && uploader.settings.dragdrop) {
            $('#' + id + '_filelist').append('<li class="plupload_droptext">' + _("Drag files here.") + '</li>');
          }
        }

        uploader.bind("UploadFile", function(up, file) {
          $('#' + file.id).addClass('plupload_current_file');
        });
        
        var originalURL = uploader.settings.url;
        uploader.bind("BeforeUpload", function(up, file) {
          (showDocumentType && file.type)
          up.settings.url = originalURL + 
            ((showDocumentType && file.type) ? "&" + up.settings.documentTypeParam + "=" + file.type : "");
        }); 


        uploader.bind('Init', function(up, res) {
          renderUI(id, target);

          // Enable rename support
          if (!settings.unique_names && settings.rename) {
            $('#' + id + '_filelist div.plupload_file_name span', target).live('click', function(e) {
              var targetSpan = $(e.target), file, parts, name, ext = "";

              // Get file name and split out name and extension
              file = up.getFile(targetSpan.parents('li')[0].id);
              name = file.name;
              parts = /^(.+)(\.[^.]+)$/.exec(name);
              if (parts) {
                name = parts[1];
                ext = parts[2];
              }

              // Display input element
              targetSpan.hide().after('<input type="text" />');
              targetSpan.next().val(name).focus().blur(function() {
                targetSpan.show().next().remove();
              }).keydown(function(e) {
                var targetInput = $(this);

                if (e.keyCode == 13) {
                  e.preventDefault();

                  // Rename file and glue extension back on
                  file.name = targetInput.val() + ext;
                  targetSpan.text(file.name);
                  targetInput.blur();
                }
              });
            });
          }

          $('a.plupload_add', target).attr('id', id + '_browse');

          up.settings.browse_button = id + '_browse';

          // Enable drag/drop
          if (up.features.dragdrop && up.settings.dragdrop) {
            up.settings.drop_element = id + '_filelist';
            $('#' + id + '_filelist').append('<li class="plupload_droptext">' + _("Drag files here.") + '</li>');
          }
          
          $('#' + id + '_container').attr('title', 'Using runtime: ' + res.runtime);

          $('a.plupload_start', target).click(function(e) {
            if (!$(this).hasClass('plupload_disabled')) {
              $('div.plupload_file_type select', target).attr('disabled', true);
              uploader.start();
            }

            e.preventDefault();
          });

          $('a.plupload_stop', target).click(function(e) {
            uploader.stop();

            e.preventDefault();
          });

          $('a.plupload_start', target).addClass('plupload_disabled');
        });

        uploader.init();

        uploader.bind("Error", function(up, err) {
          var file = err.file, message;

          if (file) {
            message = err.message;

            if (err.details) {
              message += " (" + err.details + ")";
            }

            if (err.code == plupload.FILE_SIZE_ERROR) {
              alert(_("Error: File to large: ") + file.name);
            }

            if (err.code == plupload.FILE_EXTENSION_ERROR) {
              alert(_("Error: Invalid file extension: ") + file.name);
            }

            $('#' + file.id).attr('class', 'plupload_failed').find('a').css('display', 'block').attr('title', message);
          }
        });

        uploader.bind('StateChanged', function() {
          if (uploader.state === plupload.STARTED) {
            $('li.plupload_delete a,div.plupload_buttons', target).hide();
            $('span.plupload_upload_status,div.plupload_progress,a.plupload_stop', target).css('display', 'block');
            $('span.plupload_upload_status', target).text('Uploaded 0/' + uploader.files.length + ' files');
          } else {
            $('a.plupload_stop,div.plupload_progress', target).hide();
            $('a.plupload_delete', target).css('display', 'block');
          }
        });

        uploader.bind('QueueChanged', updateList);

        uploader.bind('StateChanged', function(up) {
          if (up.state == plupload.STOPPED) {
            updateList();
          }
        });

        uploader.bind('FileUploaded', function(up, file) {
          handleStatus(file);
        });

        uploader.bind("UploadProgress", function(up, file) {
          // Set file specific progress
          $('#' + file.id + ' div.plupload_file_status', target).html(file.percent + '%');

          handleStatus(file);
          updateTotalProgress();
        });

        // Call setup function
        if (settings.setup) {
          settings.setup(uploader);
        }
      });

      return this;
    } else {
      // Get uploader instance for specified element
      return uploaders[$(this[0]).attr('id')];
    }
  };
})(jQuery);
