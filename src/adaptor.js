'use strict';

import TableNode from './canvas/node';
import * as _ from 'lodash';

export let transformInitData = (data) => {
  let {
    columns, sourceData, targetData,
    mappingData, type, extraPos,
    sortable, emptyContent, emptyWidth,
    sourceClassName, targetClassName
  } = data;
  const _genNodes = (data, nodeType, comType) => {
    if (comType === 'single' && data.constructor === Object) {
      return [_.assign({
        id: nodeType,
        type: nodeType,
        _columns: columns,
        _extraPos: extraPos,
        Class: TableNode,
        _emptyContent: emptyContent,
        _emptyWidth: emptyWidth,
        _sourceClassName: sourceClassName,
        _targetClassName: targetClassName,
        sortable
      }, data)];
    } else if (comType === 'mutiply' && data.constructor === Array) {
      return data.map((item) => {
        return _.assign({
          type: nodeType,
          _columns: columns,
          _extraPos: extraPos,
          Class: TableNode,
          _emptyContent: emptyContent,
          _emptyWidth: emptyWidth,
          _sourceClassName: sourceClassName,
          _targetClassName: targetClassName,
          sortable
        }, item);
      });
    }
  }
  let sourceNodes = _genNodes(sourceData, 'source', type);
  let targetNodes = _genNodes(targetData, 'target', type);
  let edges = mappingData.map((item) => {
    return {
      id: `${item.source}-${item.target}`,
      type: 'endpoint',
      sourceNode: item.sourceNode || sourceNodes[0].id,
      source: item.source,
      targetNode: item.targetNode || targetNodes[0].id,
      target: item.target
    }
  });
  return {
    nodes: [].concat(sourceNodes).concat(targetNodes),
    edges: edges
  };
};

export let transformChangeData = (data, comType) => {
  let result = {
    mappingData: [],
    sourceData: [],
    targetData: []
  };
  let sourceNodes = data.nodes.filter((item) => {
    return item.options.type === 'source';
  });
  let targetNodes = data.nodes.filter((item) => {
    return item.options.type === 'target';
  });
  if (comType === 'single') {
    let _sourceNode = sourceNodes[0];
    let _targetNode = targetNodes[0];
    result.mappingData = data.edges.map((item) => {
      return {
        source: item.sourceEndpoint.originId,
        target: item.targetEndpoint.originId
      }
    });
    result.sourceData = {
      title: _.get(_sourceNode, 'options.title'),
      fields: _.get(_sourceNode, 'options.fields')
    };
    result.targetData = {
      title: _.get(_targetNode, 'options.title'),
      fields: _.get(_targetNode, 'options.fields')
    };
  } else if (comType === 'mutiply') {
    result.mappingData = data.edges.map((item) => {
      return {
        sourceNode: item.sourceNode.id,
        targetNode: item.targetNode.id,
        source: item.sourceEndpoint.originId,
        target: item.targetEndpoint.originId
      }
    });
    result.sourceData = sourceNodes.map((item) => {
      return {
        title: _.get(item, 'options.title'),
        fields: _.get(item, 'options.fields')
      };
    });
    result.targetData = targetNodes.map((item) => {
      return {
        title: _.get(item, 'options.title'),
        fields: _.get(item, 'options.fields')
      };
    });
  }
  return result;
};


export let diffPropsData = (newData, oldData) => {


  let _newNodes = newData.nodes || [];
  let _oldNodes = oldData.nodes || [];

  const isSameId = (a, b) => a.id === b.id;

  let addNodes = _.differenceWith(newData.nodes, oldData.nodes, isSameId);
  let rmNodes = _.differenceWith(oldData.nodes, newData.nodes, isSameId);
  

  let addFields = [];
  let rmFields = [];


  newData.nodes.forEach((_newNode) => {
    let _oldNode = _.find(oldData.nodes, _node => _node.id === _newNode.id);
    if (_oldNode) {
      let result = _.differenceWith(_newNode.fields, _.get(_oldNode, 'options.fields'), isSameId);
      if (result.length > 0) {
        addFields.push({
          id: _newNode.id,
          type: _newNode.type,
          fields: result
        });
      }
    }
  });
  
  oldData.nodes.forEach((_oldNode) => {
    let _newNode = _.find(newData.nodes, _node => _node.id === _oldNode.id);
    if (_newNode) {
      let result = _.differenceWith(_.get(_oldNode, 'options.fields'), _newNode.fields, isSameId);
      if (result.length > 0) {
        rmFields.push({
          id: _newNode.id,
          type: _newNode.type,
          fields: result
        });
      }
    }
  });

  const isSameEdge = (a, b) => {
    return (
      a.sourceNode === b.sourceNode &&
      a.targetNode === b.targetNode &&
      a.source === b.source &&
      a.target === b.target
    );
  }

  let addEdges = _.differenceWith(newData.edges, oldData.edges, isSameEdge);
  let rmEdges = _.differenceWith(oldData.edges, newData.edges, isSameEdge);

  let result = {
    addEdges,
    rmEdges,
    addNodes,
    rmNodes,
    addFields,
    rmFields
  };


  return result;
};