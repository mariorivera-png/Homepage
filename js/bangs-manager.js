class BangsManager {
    constructor() {
        this.bangs = [];
        this.categories = {};
        this.settings = {};
        this.loaded = false;
    }

    async loadBangs() {
        try {
            const response = await fetch('/data/bangs.json');
            const data = await response.json();
            this.bangs = data.bangs;
            this.categories = data.categories;
            this.settings = data.settings;
            this.loaded = true;
            return true;
        } catch (error) {
            console.error('Failed to load bangs:', error);
            return false;
        }
    }

    async saveBangs() {
        try {
            const data = {
                bangs: this.bangs,
                categories: this.categories,
                settings: this.settings
            };
            const response = await fetch('/api/save-bangs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to save bangs:', error);
            return false;
        }
    }

    getBang(id) {
        return this.bangs.find(b => b.id === id);
    }

    getAllBangs() {
        return this.bangs.filter(b => b.enabled);
    }

    getBangsByCategory(category) {
        return this.bangs.filter(b => b.category === category && b.enabled);
    }

    addBang(bang) {
        const existing = this.getBang(bang.id);
        if (existing) {
            return false;
        }
        bang.created = new Date().toISOString();
        bang.usageCount = 0;
        bang.enabled = true;
        this.bangs.push(bang);
        return true;
    }

    updateBang(id, updates) {
        const index = this.bangs.findIndex(b => b.id === id);
        if (index !== -1) {
            this.bangs[index] = { ...this.bangs[index], ...updates };
            return true;
        }
        return false;
    }

    deleteBang(id) {
        const index = this.bangs.findIndex(b => b.id === id);
        if (index !== -1) {
            this.bangs.splice(index, 1);
            return true;
        }
        return false;
    }

    incrementUsage(id) {
        const bang = this.getBang(id);
        if (bang) {
            bang.usageCount++;
            this.saveBangs(); // Async, don't await to not block
        }
    }

    searchBangs(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.bangs.filter(b => 
            b.id.toLowerCase().includes(lowercaseQuery) ||
            b.name.toLowerCase().includes(lowercaseQuery) ||
            b.description.toLowerCase().includes(lowercaseQuery) ||
            b.category.toLowerCase().includes(lowercaseQuery)
        );
    }

    parseBangs(input) {
        const availableBangs = this.getAllBangs().map(b => '!' + b.id);
        let remainingInput = input;
        let foundBangs = [];
        
        while (remainingInput.length > 0) {
            let matched = false;
            
            for (let bang of availableBangs) {
                if (remainingInput.startsWith(bang + " ")) {
                    foundBangs.push(bang.substring(1)); // Remove the ! prefix
                    remainingInput = remainingInput.substring(bang.length + 1).trim();
                    matched = true;
                    break;
                } else if (remainingInput.startsWith(bang)) {
                    const nextChar = remainingInput[bang.length];
                    if (nextChar === undefined || nextChar === ' ' || nextChar === '!') {
                        foundBangs.push(bang.substring(1));
                        remainingInput = remainingInput.substring(bang.length);
                        matched = true;
                        break;
                    }
                }
            }
            
            if (!matched) {
                break;
            }
        }
        
        if (foundBangs.length > 0) {
            // Increment usage for all used bangs
            foundBangs.forEach(bangId => this.incrementUsage(bangId));
            return { bangs: foundBangs, searchTerm: remainingInput.trim() };
        } else {
            return { bangs: [], searchTerm: input };
        }
    }

    async performSearch(input) {
        if (!input.trim()) {
            alert("Please enter a search term");
            return;
        }
        
        const { bangs: bangIds, searchTerm } = this.parseBangs(input);
        
        if (bangIds.length === 0) {
            // Use default search
            const url = this.settings.defaultSearch.replace(
                "{search}",
                encodeURIComponent(input)
            );
            window.location.href = url;
            return;
        }
        
        if (!searchTerm) {
            alert("Please enter a search term after the bangs");
            return;
        }
        
        const urls = [];
        const invalidBangs = [];
        
        for (let bangId of bangIds) {
            const bang = this.getBang(bangId);
            if (bang && bang.enabled) {
                const url = bang.url.replace(
                    "{search}",
                    encodeURIComponent(searchTerm)
                );
                urls.push(url);
            } else {
                invalidBangs.push('!' + bangId);
            }
        }
        
        if (invalidBangs.length > 0) {
            alert(`Warning: The following bangs were not found: ${invalidBangs.join(', ')}`);
        }
        
        if (urls.length > 0) {
            for (let i = 0; i < urls.length; i++) {
                if (i === 0 && !this.settings.openInNewTab) {
                    window.location.href = urls[i];
                } else {
                    window.open(urls[i], '_blank');
                }
            }
        } else {
            alert("No valid bangs found. Searching on default engine instead.");
            const url = this.settings.defaultSearch.replace(
                "{search}",
                encodeURIComponent(searchTerm || input)
            );
            window.location.href = url;
        }
    }
}

// Initialize the manager
const bangsManager = new BangsManager();
await bangsManager.loadBangs();