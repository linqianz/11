App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    
    let age = '';
    let breed = '';
    let pets = [];
    $.getJSON('../pets.json', function(data) {
      pets = data;
      let ageSet = new Set();
      let breedSet = new Set();

      for (let i = 0; i < pets.length; i ++) {
        App.appendPet(pets[i]);
        ageSet.add(pets[i].age);
        breedSet.add(pets[i].breed);
      }

      for (let item of ageSet) {
        $("#ageSelect").append("<option value='"+item+"'>"+item+"</option>");
      }

      for (let item of breedSet) {
        $("#breedSelect").append("<option value='"+item+"'>"+item+"</option>");
      }
    });

    $('#ageSelect').change(function(){
      if (age !== $(this).children('option:selected').val()) {
        age = $(this).children('option:selected').val();
        App.filterPet(pets, age, breed);
      }
    });

    $('#breedSelect').change(function(){
      if (breed !== $(this).children('option:selected').val()) {
        breed = $(this).children('option:selected').val();
        App.filterPet(pets, age, breed);
      }
    });

    return await App.initWeb3();
  },

  appendPet: function(pet) {
    let petsRow = $('#petsRow');
    let petTemplate = $('#petTemplate');
    petTemplate.find('.panel-title').text(pet.name);
    petTemplate.find('img').attr('src', pet.picture);
    petTemplate.find('.pet-breed').text(pet.breed);
    petTemplate.find('.pet-age').text(pet.age);
    petTemplate.find('.pet-location').text(pet.location);
    petTemplate.find('.btn-adopt').attr('data-id', pet.id);
    petsRow.append(petTemplate.html());
  },

  filterPet: function(pets, age, breed) {
    let petsRow = $('#petsRow');
    petsRow.empty();
    for (let i = 0; i < pets.length; i ++) {
      if (!age && !breed) {
        App.appendPet(pets[i]);
      } else {
        if (!age && breed) {
          if (breed === (pets[i].breed + '')) {
            App.appendPet(pets[i]);
          }
        } else if (age && !breed) {
          if (age === (pets[i].age + '')) {
            App.appendPet(pets[i]);
          }
        } else {
          if (age === (pets[i].age + '') && breed === (pets[i].breed + '')) {
            App.appendPet(pets[i]);
          }
        }
      }
    }
  },

  initWeb3: async function() {

    // Modern dapp browsers...
if (window.ethereum) {
  App.web3Provider = window.ethereum;
  try {
    // Request account access
    await window.ethereum.enable();
  } catch (error) {
    // User denied account access...
    console.error("User denied account access")
  }
}
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {

    // Modern dapp browsers...
  if (window.ethereum) {
    App.web3Provider = window.ethereum;
    try {
      // Request account access
      await window.ethereum.enable();
    } catch (error) {
      // User denied account access...
      console.error("User denied account access")
    }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    App.web3Provider = window.web3.currentProvider;
  }
  // If no injected web3 instance is detected, fall back to Ganache
  else {
    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
  }
  web3 = new Web3(App.web3Provider);

  // load default account data
  web3.eth.getCoinbase(function(err, account) {
    if (err == null){
      App.account = account;
      //console.log("coinbase account is", account);
    }
  });

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },


  markAdopted: function(adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;
    
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
    
        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  donateMeEther: function() {
    App.contracts.Adoption.deployed().then(function(instance) {      
      //send ether from the account to the contract
      var amount = $('#donationAmount').val();
      console.log(amount);
      web3.eth.sendTransaction({
        from: App.account,
        to: App.contracts.Adoption.address,
        value: amount
      }, function(err, transactionHash) {
        if(err) { console.log(err);}
        else {
          console.log(transactionHash + " success");
        }
      });
      $(window).alert("Thanks for your donation");
    });
    
    
    


  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
