CIRelationshipsTools
====================
----------

Description
-----------
Cette classe permet de retrouver la liste des CIs en relation avec un CI donné ainsi que de générer des filtres pour Reference Qualifier.

Attributs
-------
**_optionsTemplate**
Stock les templates d'options au sein même de la classe. Un template est sélectionnable à l'instanciation de la classe. Implémente un algorithme de parcours en largeur d'arbre orienté.

Méthodes
--------
**CIRelationshipsTools(ciSysID,options)**
Entrée : 
 - **ciSysID** : *String* : Identifiant système d'un élément de configuration
 - **options** : *Object* : Contient le [paramétrage](#options) de la recherche

----------
<a name="options"></a>Options
-------
Cette classe propose plusieurs paramètres permettant le filtrage des éléments de configuration et influençant le déroulement de l'algorithme.
Il existe deux types de paramètres, ceux agissant comme un filtre sur le GlideRecord récupérant les enfants (d'un point de vue arbre) d'un CI et ceux agissant indépendant de la requête au serveur et lors de la boucle de parcours des résultats. Ainsi, filtrer un CI avec le premier type de filtre reviendra à élaguer toute une branche de l'arbre tandis qu'un filtre du second type pourrai ou non élaguer la branche correspondant aux enfants du CI. Pour ces filtre, le comportement est détaillé dans leur description.

<a name="authClass"></a>**authClass** : *Array* : Action après le GlideRecord.
Liste des classes de CI à autoriser dans le résultat. Si un CI est rejeté par ce filtre, ces enfants seront tout de même parcourus.

<a name="prohClass"></a>**prohClass** : *Array* : Action après le GlideRecord.
Liste des classes de CI à ne pas autoriser dans le résultat. Si un CI est rejeté par ce filtre, ces enfants seront tout de même parcourus. 
!!! Si l'option **[authClass](#authClass)** est utilisée, **prohClass** ne sera pas considérée.

<a name="filterCI"></a>**filterCI** : *Function* :  Action après le glide record.
Fonction de filtrage "libre". Peut accepter un paramètre en entrée correspondant à un GlideRecord de CI. Doit obligatoirement renvoyer un *Array* de deux *boolean*:
[bool1,bool2] :
 - bool1 : Indique si le CI est à intégrer au résultat
 - bool2 : Indique si la recherche dans cette branche de l'arbre doit se poursuivre
> Exemple de fonction :
> `function(curr){
> return [curr.u_active==true,true];
> }`

