import json
import os

def get_indicator_list(indicators_path='../../../client/datum/indicators.json', exclude_list=None):
    """
    Load and clean indicators data from JSON file.
    
    Args:
        indicators_path (str): Path to the indicators JSON file
        exclude_list (list): List of indicator names to exclude. If None, uses default exclusions.
    
    Returns:
        list: Cleaned list of indicators with 'name' and 'description' fields
    """
    if exclude_list is None:
        exclude_list = [
            'Total area',
            'Amazonia',
            'Countries',
            'States',
            'Municipalities',
            'Administrative Capitals'
        ]
    
    # Load full indicators data
    indicator_data = json.load(open(indicators_path, 'r'))
    
    # Create clean indicator list
    indicator_list_clean = []
    for indicator in indicator_data:
        clean_indicator = {
            'name': indicator.get('name_en', ''),
            'description': indicator.get('description_short_en', '')
        }
        indicator_list_clean.append(clean_indicator)
    
    # Filter out excluded indicators
    indicator_list_clean = [
        ind for ind in indicator_list_clean 
        if not any(excl in ind['name'] for excl in exclude_list)
    ]
    
    return indicator_list_clean
