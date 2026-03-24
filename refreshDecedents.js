/**
* -----------------------------------------------------------------
* refrestDecedents.js
* Chevra Kadisha Guest Form 
* -----------------------------------------------------------------
* refrestDecedents.js
Version: 1.0.0 * Last updated: 2026-03-23
 * 
 * CHANGELOG v1.0.0:
 *   - First Release
 * 
 * Utilizes bckLib library to determine latest decedents and update form
 * -----------------------------------------------------------------
 */


/**
 * Refreshes the "Name of Deceased" checkbox question in the active Google Form with current decedent names.
 * 
 * Uses the `bckLib` library if available to fetch decedent data from the configured LATEST_MASTER sheet.
 * Falls back to "No Shmira Available" if library is missing, function fails, or no decedents found.
 * Skips update if choices haven't changed (avoids unnecessary FormApp calls).
 * 
 * **Time-driven trigger ready** - safe for 10-minute intervals.
 * 
 * @author Chevra Kadisha Admin
 * @version 2.0.0
 * @since 2026-03-23
 * @example
 *   // Run manually or via ScriptApp.newTrigger('triggerDecedentRefresh').timeBased().everyMinutes(10).create()
 */
function triggerDecedentRefresh() {
  // Default fallback
  let names = ['No Shmira Available'];
  
  if (typeof bckLib !== 'undefined' && typeof bckLib.getDecedents === 'function') {
    try {
      const sheetInputs = bckLib.getSheetInputs();
      if (sheetInputs) {
        const decedents = bckLib.getDecedents(sheetInputs);
        names = decedents
          ?.map(d => d.name?.trim())
          ?.filter(Boolean)
          ?.sort() || [];
        
        if (names.length === 0) names = ['No Shmira Available'];
        Logger.log(`✅ Loaded ${names.length} decedents`);
        return updateCheckboxIfChanged(names, 'Name of Deceased');
      }
    } catch (e) {
      Logger.log(`❌ bckLib error: ${e.message}`);
    }
  } else {
    Logger.log('⚠️ bckLib unavailable');
  }
  
  updateCheckboxIfChanged(names, 'Name of Deceased');
}

/**
 * Updates a checkbox question only if choices have changed.
 * 
 * Compares new choices against current using fast string join (avoids JSON.stringify).
 * Throws descriptive error if question not found.
 * Logs success/failure for monitoring.
 * 
 * @param {string[]} newChoices - Array of choice values to set (e.g., `['John Doe', 'Jane Smith']`)
 * @param {string} questionTitle - Exact title of checkbox question to update
 * @throws {Error} If checkbox question not found in active form
 * @returns {void}
 * @private
 */
function updateCheckboxIfChanged(newChoices, questionTitle) {
  const form = FormApp.getActiveForm();
  const checkbox = form.getItems(FormApp.ItemType.CHECKBOX)
    .find(item => item.getTitle() === questionTitle)?.asCheckboxItem();
  
  if (!checkbox) {
    throw new Error(`Question "${questionTitle}" not found`);
  }
  
  const current = checkbox.getChoices().map(c => c.getValue());
  if (newChoices.join('||') === current.join('||')) {
    Logger.log('Choices unchanged');
    return;
  }
  
  checkbox.setChoiceValues(newChoices);
  Logger.log(`✅ Updated ${newChoices.length} choices`);
}
