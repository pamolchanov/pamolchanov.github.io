#!/usr/bin/env python3
"""
Script to update teaser image paths in featured_details.json
"""

import json
import os
from pathlib import Path

def update_teaser_images():
    """Update image paths for papers that have teaser images"""
    
    # Paths
    featured_details_path = 'data/featured_details.json'
    teasers_dir = Path('assets/images/teasers')
    
    # Load featured details
    with open(featured_details_path, 'r') as f:
        featured_details = json.load(f)
    
    updated_count = 0
    
    # Check each paper for available teaser images
    for paper_id, details in featured_details.items():
        # Look for image files with this paper ID
        possible_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        
        for ext in possible_extensions:
            image_path = teasers_dir / f"{paper_id}{ext}"
            if image_path.exists():
                # Update the image path
                old_image = details.get('image', '')
                new_image = f"assets/images/teasers/{paper_id}{ext}"
                
                if old_image != new_image:
                    details['image'] = new_image
                    updated_count += 1
                    print(f"Updated {paper_id}: {old_image} -> {new_image}")
                break
    
    # Save updated featured details
    if updated_count > 0:
        with open(featured_details_path, 'w') as f:
            json.dump(featured_details, f, indent=2)
        print(f"\nUpdated {updated_count} teaser images")
    else:
        print("No teaser images found to update")
        print(f"Add image files to {teasers_dir} directory")

if __name__ == "__main__":
    update_teaser_images()







